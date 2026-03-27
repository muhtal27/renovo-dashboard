'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  FileText,
  ImageIcon,
  MessageSquareText,
  RefreshCcw,
  Send,
  TriangleAlert,
  Upload,
  Video,
} from 'lucide-react'
import {
  createEotEvidence,
  createEotMessage,
  getEotCaseSubmission,
  getEotCaseTimeline,
  getEotCaseWorkspaceSummary,
  listEotCaseDocuments,
  listEotCaseEvidence,
  listEotCaseIssues,
  listEotCaseMessages,
  upsertEotIssue,
} from '@/lib/eot-api'
import type {
  CreateEotEvidenceInput,
  CreateEotMessageInput,
  EotCaseSubmission,
  EotCaseTimelineItem,
  EotCaseWorkspaceSummary,
  EotDocument,
  EotEvidence,
  EotEvidenceType,
  EotIssue,
  EotIssueSeverity,
  EotIssueStatus,
  EotMessage,
  EotMessageSenderType,
  EotRecommendationDecision,
  EotSectionPage,
  UpsertEotIssueInput,
} from '@/lib/eot-types'
import {
  ActivityTimeline,
  DetailPanel,
  EmptyState,
  KPIStatCard,
  KeyValueList,
  MetaItem,
  PageHeader,
  ProgressBar,
  SectionCard,
  SkeletonPanel,
  StatusBadge,
  WorkspaceSection,
  formatAddress,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnumLabel,
  getCaseProgress,
} from '@/app/eot/_components/eot-ui'
import { getEotUiErrorMessage } from '@/lib/eot-errors'

type WorkspaceClientProps = {
  caseId: string
  defaultActor: string
  initialWorkspace?: EotCaseWorkspaceSummary | null
}

type EvidenceFormState = {
  fileUrl: string
  type: EotEvidenceType
  area: string
  uploadedBy: string
  metadata: string
}

type IssueFormState = {
  issueId: string | null
  title: string
  description: string
  severity: EotIssueSeverity
  status: EotIssueStatus
  evidenceIds: string[]
  decision: EotRecommendationDecision | ''
  rationale: string
  estimatedCost: string
}

type MessageFormState = {
  senderType: EotMessageSenderType
  senderId: string
  content: string
  attachments: string
}

const DEFAULT_EVIDENCE_FORM = (defaultActor: string): EvidenceFormState => ({
  fileUrl: '',
  type: 'document',
  area: '',
  uploadedBy: defaultActor,
  metadata: '',
})

const DEFAULT_ISSUE_FORM: IssueFormState = {
  issueId: null,
  title: '',
  description: '',
  severity: 'medium',
  status: 'open',
  evidenceIds: [],
  decision: '',
  rationale: '',
  estimatedCost: '',
}

const DEFAULT_MESSAGE_FORM = (defaultActor: string): MessageFormState => ({
  senderType: 'manager',
  senderId: defaultActor,
  content: '',
  attachments: '',
})

const WORKSPACE_CACHE_TTL_MS = 30_000

type SectionKey =
  | 'evidence'
  | 'issues'
  | 'submission'
  | 'timeline'
  | 'documents'
  | 'messages'

type WorkspaceSectionPayloads = {
  evidence: EotSectionPage<EotEvidence>
  issues: EotIssue[]
  submission: EotCaseSubmission
  timeline: EotCaseTimelineItem[]
  documents: EotSectionPage<EotDocument>
  messages: EotSectionPage<EotMessage>
}

type WorkspaceSectionState<T> = {
  data: T | null
  loading: boolean
  loadingMore: boolean
  loaded: boolean
  error: string | null
}

type WorkspaceSectionStateMap = {
  [K in SectionKey]: WorkspaceSectionState<WorkspaceSectionPayloads[K]>
}

const summaryCache = new Map<string, { summary: EotCaseWorkspaceSummary; cachedAt: number }>()
const summaryRequests = new Map<string, Promise<EotCaseWorkspaceSummary>>()
const sectionCache = new Map<string, { data: unknown; cachedAt: number }>()
const sectionRequests = new Map<string, Promise<unknown>>()
const SECTION_PAGE_SIZE = 24
const EMPTY_EVIDENCE: EotEvidence[] = []
const EMPTY_ISSUES: EotIssue[] = []
const EMPTY_MESSAGES: EotMessage[] = []
const EMPTY_DOCUMENTS: EotDocument[] = []
const EMPTY_TIMELINE: EotCaseTimelineItem[] = []
const EMPTY_EVIDENCE_PAGE: EotSectionPage<EotEvidence> = {
  items: EMPTY_EVIDENCE,
  next_offset: null,
  has_more: false,
}
const EMPTY_MESSAGE_PAGE: EotSectionPage<EotMessage> = {
  items: EMPTY_MESSAGES,
  next_offset: null,
  has_more: false,
}
const EMPTY_DOCUMENT_PAGE: EotSectionPage<EotDocument> = {
  items: EMPTY_DOCUMENTS,
  next_offset: null,
  has_more: false,
}

function isPaginatedSection(section: SectionKey): section is 'evidence' | 'messages' | 'documents' {
  return section === 'evidence' || section === 'messages' || section === 'documents'
}

function primeWorkspaceSummaryCache(
  caseId: string,
  summary: EotCaseWorkspaceSummary | null | undefined
) {
  if (!summary) {
    return
  }

  summaryCache.set(caseId, {
    summary,
    cachedAt: Date.now(),
  })
}

function getCachedWorkspaceSummary(caseId: string) {
  const cached = summaryCache.get(caseId)

  if (!cached) {
    return null
  }

  if (Date.now() - cached.cachedAt >= WORKSPACE_CACHE_TTL_MS) {
    summaryCache.delete(caseId)
    return null
  }

  return cached.summary
}

async function loadWorkspaceSummarySnapshot(caseId: string, forceRefresh = false) {
  const cached = getCachedWorkspaceSummary(caseId)

  if (!forceRefresh && cached) {
    return cached
  }

  if (!forceRefresh) {
    const inFlight = summaryRequests.get(caseId)
    if (inFlight) {
      return inFlight
    }
  }

  const request = getEotCaseWorkspaceSummary(caseId)
    .then((summary) => {
      primeWorkspaceSummaryCache(caseId, summary)
      return summary
    })
    .finally(() => {
      if (summaryRequests.get(caseId) === request) {
        summaryRequests.delete(caseId)
      }
    })

  summaryRequests.set(caseId, request)
  return request
}

function getSectionCacheKey(caseId: string, section: SectionKey) {
  return `${caseId}:${section}`
}

function primeWorkspaceSectionCache<K extends SectionKey>(
  caseId: string,
  section: K,
  data: WorkspaceSectionPayloads[K] | null | undefined
) {
  if (data == null) {
    return
  }

  sectionCache.set(getSectionCacheKey(caseId, section), {
    data,
    cachedAt: Date.now(),
  })
}

function getCachedWorkspaceSection<K extends SectionKey>(
  caseId: string,
  section: K
): WorkspaceSectionPayloads[K] | null {
  const cached = sectionCache.get(getSectionCacheKey(caseId, section))

  if (!cached) {
    return null
  }

  if (Date.now() - cached.cachedAt >= WORKSPACE_CACHE_TTL_MS) {
    sectionCache.delete(getSectionCacheKey(caseId, section))
    return null
  }

  return cached.data as WorkspaceSectionPayloads[K]
}

async function fetchWorkspaceSection<K extends SectionKey>(
  caseId: string,
  section: K,
  options?: { offset?: number; limit?: number }
): Promise<WorkspaceSectionPayloads[K]> {
  switch (section) {
    case 'evidence':
      return listEotCaseEvidence(caseId, options) as Promise<WorkspaceSectionPayloads[K]>
    case 'issues':
      return listEotCaseIssues(caseId) as Promise<WorkspaceSectionPayloads[K]>
    case 'submission':
      return getEotCaseSubmission(caseId) as Promise<WorkspaceSectionPayloads[K]>
    case 'timeline':
      return getEotCaseTimeline(caseId) as Promise<WorkspaceSectionPayloads[K]>
    case 'documents':
      return listEotCaseDocuments(caseId, options) as Promise<WorkspaceSectionPayloads[K]>
    case 'messages':
      return listEotCaseMessages(caseId, options) as Promise<WorkspaceSectionPayloads[K]>
  }
}

async function loadWorkspaceSectionSnapshot<K extends SectionKey>(
  caseId: string,
  section: K,
  options?: { forceRefresh?: boolean; offset?: number; limit?: number }
): Promise<WorkspaceSectionPayloads[K]> {
  const forceRefresh = options?.forceRefresh ?? false
  const cached = getCachedWorkspaceSection(caseId, section)

  const isPageRequest = (options?.offset ?? 0) > 0

  if (!forceRefresh && !isPageRequest && cached) {
    return cached
  }

  const requestKey = `${getSectionCacheKey(caseId, section)}:${options?.offset ?? 0}:${options?.limit ?? 'default'}`

  if (!forceRefresh) {
    const inFlight = sectionRequests.get(requestKey)
    if (inFlight) {
      return inFlight as Promise<WorkspaceSectionPayloads[K]>
    }
  }

  const request = fetchWorkspaceSection(caseId, section, options)
    .then((data) => {
      if (!isPageRequest) {
        primeWorkspaceSectionCache(caseId, section, data)
      }
      return data
    })
    .finally(() => {
      if (sectionRequests.get(requestKey) === request) {
        sectionRequests.delete(requestKey)
      }
    })

  sectionRequests.set(requestKey, request)
  return request
}

function createInitialSectionState<K extends SectionKey>(
  caseId: string,
  section: K
): WorkspaceSectionState<WorkspaceSectionPayloads[K]> {
  const cached = getCachedWorkspaceSection(caseId, section)

  return {
    data: cached,
    loading: false,
    loadingMore: false,
    loaded: cached != null,
    error: null,
  }
}

function createInitialSectionStates(caseId: string): WorkspaceSectionStateMap {
  return {
    evidence: createInitialSectionState(caseId, 'evidence'),
    issues: createInitialSectionState(caseId, 'issues'),
    submission: createInitialSectionState(caseId, 'submission'),
    timeline: createInitialSectionState(caseId, 'timeline'),
    documents: createInitialSectionState(caseId, 'documents'),
    messages: createInitialSectionState(caseId, 'messages'),
  }
}

function getClaimReadiness(summary: EotCaseWorkspaceSummary) {
  if (summary.claim) {
    return {
      label: 'Claim generated',
      description: 'Submission pack is available for review and export.',
      tone: 'ready',
    } as const
  }

  if (summary.case.status === 'ready_for_claim') {
    return {
      label: 'Awaiting submission',
      description: 'Checkout is marked ready but a formal claim pack has not been generated.',
      tone: 'attention',
    } as const
  }

  return {
    label: 'In preparation',
    description: 'Evidence and issue review are still in progress.',
    tone: 'default',
  } as const
}

function EvidenceIcon({ type }: { type: EotEvidenceType }) {
  if (type === 'image') return <ImageIcon className="h-4 w-4" />
  if (type === 'video') return <Video className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

function IssueCard({
  issue,
  active,
  onEdit,
}: {
  issue: EotIssue
  active: boolean
  onEdit: (issue: EotIssue) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onEdit(issue)}
      className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
        <StatusBadge label={formatEnumLabel(issue.status)} tone={issue.status} />
        {issue.recommendation?.decision ? (
          <StatusBadge
            label={formatEnumLabel(issue.recommendation.decision)}
            tone={issue.recommendation.decision}
          />
        ) : null}
      </div>
      <p className={`mt-3 text-sm font-semibold ${active ? 'text-white' : 'text-slate-950'}`}>
        {issue.title}
      </p>
      <p className={`mt-2 text-sm leading-6 ${active ? 'text-slate-200' : 'text-slate-600'}`}>
        {issue.description?.trim() || 'No narrative has been added for this issue yet.'}
      </p>
      <div className={`mt-3 text-xs uppercase tracking-[0.14em] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
        {issue.linked_evidence.length} linked evidence item{issue.linked_evidence.length === 1 ? '' : 's'}
      </div>
    </button>
  )
}

function SectionBody({
  isOpen,
  loading,
  loadingMore,
  loaded,
  error,
  closedPreview,
  retryLabel,
  onRetry,
  children,
}: {
  isOpen: boolean
  loading: boolean
  loadingMore: boolean
  loaded: boolean
  error: string | null
  closedPreview: string
  retryLabel?: string
  onRetry: () => void
  children: React.ReactNode
}) {
  if (!isOpen) {
    return <p className="text-sm leading-6 text-slate-600">{closedPreview}</p>
  }

  if (loading && !loaded) {
    return <SkeletonPanel />
  }

  if (error && !loaded) {
    return (
      <div className="space-y-3">
        <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getEotUiErrorMessage(error)}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          {retryLabel ?? 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && loaded ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{getEotUiErrorMessage(error)}</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-[12px] border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900"
          >
            {retryLabel ?? 'Retry'}
          </button>
        </div>
      ) : null}
      {loadingMore ? (
        <p className="text-sm text-slate-500">Loading more items…</p>
      ) : null}
      {children}
    </div>
  )
}

export function EotWorkspaceClient({
  caseId,
  defaultActor,
  initialWorkspace,
}: WorkspaceClientProps) {
  primeWorkspaceSummaryCache(caseId, initialWorkspace)

  const searchParams = useSearchParams()
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''

  const [summary, setSummary] = useState<EotCaseWorkspaceSummary | null>(
    () => initialWorkspace ?? getCachedWorkspaceSummary(caseId)
  )
  const [loading, setLoading] = useState(
    initialWorkspace == null && getCachedWorkspaceSummary(caseId) == null
  )
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const hasLoadedSummaryRef = useRef(Boolean(initialWorkspace ?? getCachedWorkspaceSummary(caseId)))

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    evidence: false,
    issues: false,
    submission: false,
    timeline: false,
    documents: false,
    messages: false,
  })
  const [sections, setSections] = useState<WorkspaceSectionStateMap>(() =>
    createInitialSectionStates(caseId)
  )
  const sectionStateRef = useRef(sections)

  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
  const [evidenceForm, setEvidenceForm] = useState<EvidenceFormState>(
    DEFAULT_EVIDENCE_FORM(defaultActor)
  )
  const [issueForm, setIssueForm] = useState<IssueFormState>(DEFAULT_ISSUE_FORM)
  const [messageForm, setMessageForm] = useState<MessageFormState>(DEFAULT_MESSAGE_FORM(defaultActor))

  const [evidencePending, setEvidencePending] = useState(false)
  const [issuePending, setIssuePending] = useState(false)
  const [messagePending, setMessagePending] = useState(false)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)

  useEffect(() => {
    sectionStateRef.current = sections
  }, [sections])

  useEffect(() => {
    setEvidenceForm(DEFAULT_EVIDENCE_FORM(defaultActor))
    setMessageForm(DEFAULT_MESSAGE_FORM(defaultActor))
  }, [defaultActor])

  useEffect(() => {
    setSections(createInitialSectionStates(caseId))
    setOpenSections({
      evidence: false,
      issues: false,
      submission: false,
      timeline: false,
      documents: false,
      messages: false,
    })
    setSelectedEvidenceId(null)
    setIssueForm(DEFAULT_ISSUE_FORM)
  }, [caseId])

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      if (initialWorkspace) {
        return
      }

      const hasExistingSummary = hasLoadedSummaryRef.current
      const shouldRefreshInBackground = hasExistingSummary

      if (shouldRefreshInBackground) {
        setRefreshing(true)
        setRefreshError(null)
      } else {
        setLoading(true)
        setError(null)
      }

      try {
        const nextSummary = shouldRefreshInBackground
          ? await loadWorkspaceSummarySnapshot(caseId, true)
          : await loadWorkspaceSummarySnapshot(caseId)

        if (!cancelled) {
          setSummary(nextSummary)
          setError(null)
          setRefreshError(null)
          hasLoadedSummaryRef.current = true
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : 'Unable to load the checkout workspace.'

          if (hasExistingSummary) {
            setRefreshError(`${message} Showing the last loaded workspace data.`)
          } else {
            setError(message)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadSummary()

    return () => {
      cancelled = true
    }
  }, [caseId, initialWorkspace])

  function mergeSectionState<K extends SectionKey>(
    section: K,
    patch: Partial<WorkspaceSectionState<WorkspaceSectionPayloads[K]>>
  ) {
    setSections((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch,
      },
    }))
  }

  async function ensureSectionLoaded<K extends SectionKey>(
    section: K,
    options?: { forceRefresh?: boolean }
  ) {
    const forceRefresh = options?.forceRefresh ?? false
    const current = sectionStateRef.current[section]

    if (!forceRefresh && current.loaded && current.data != null) {
      return current.data
    }

    mergeSectionState(section, {
      loading: true,
      error: null,
    })

    try {
      const data = await loadWorkspaceSectionSnapshot(caseId, section, {
        forceRefresh,
        limit:
          forceRefresh && isPaginatedSection(section) && current.data
            ? Math.max(
                SECTION_PAGE_SIZE,
                Math.min((current.data as EotSectionPage<unknown>).items.length || SECTION_PAGE_SIZE, 100)
              )
            : undefined,
      })

      if (section === 'submission') {
        const submissionData = data as WorkspaceSectionPayloads['submission']
        primeWorkspaceSectionCache(caseId, 'issues', submissionData.issues)
        setSections((currentState) => ({
          ...currentState,
          issues: {
            data: submissionData.issues,
            loading: false,
            loadingMore: false,
            loaded: true,
            error: null,
          },
          submission: {
            data: submissionData,
            loading: false,
            loadingMore: false,
            loaded: true,
            error: null,
          },
        }))
        return data
      }

      mergeSectionState(section, {
        data,
        loaded: true,
        loading: false,
        loadingMore: false,
        error: null,
      })

      return data
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Unable to load this checkout section.'

      mergeSectionState(section, {
        loading: false,
        loadingMore: false,
        error: message,
      })

      throw loadError
    }
  }

  async function loadMoreSection(section: 'evidence' | 'messages' | 'documents') {
    const current = sectionStateRef.current[section]

    if (!current.data || current.loadingMore || !current.data.has_more || current.data.next_offset == null) {
      return
    }

    mergeSectionState(section, {
      loadingMore: true,
      error: null,
    })

    try {
      const nextPage = await loadWorkspaceSectionSnapshot(caseId, section, {
        offset: current.data.next_offset,
        limit: SECTION_PAGE_SIZE,
      })

      const merged = {
        items: [...current.data.items, ...nextPage.items],
        next_offset: nextPage.next_offset,
        has_more: nextPage.has_more,
      } as WorkspaceSectionPayloads[typeof section]

      primeWorkspaceSectionCache(caseId, section, merged)
      mergeSectionState(section, {
        data: merged,
        loaded: true,
        loading: false,
        loadingMore: false,
        error: null,
      })
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Unable to load more items for this section.'

      mergeSectionState(section, {
        loadingMore: false,
        error: message,
      })
    }
  }

  useEffect(() => {
    const evidenceItems = sections.evidence.data?.items ?? EMPTY_EVIDENCE
    if (!evidenceItems.length) {
      setSelectedEvidenceId(null)
      return
    }

    setSelectedEvidenceId((current) =>
      current && evidenceItems.some((item) => item.id === current) ? current : evidenceItems[0].id
    )
  }, [sections.evidence.data])

  const evidencePage = sections.evidence.data ?? EMPTY_EVIDENCE_PAGE
  const evidence = evidencePage.items
  const issues = sections.issues.data ?? EMPTY_ISSUES
  const submission = sections.submission.data
  const timeline = sections.timeline.data ?? EMPTY_TIMELINE
  const documentsPage = sections.documents.data ?? EMPTY_DOCUMENT_PAGE
  const documents = documentsPage.items
  const messagesPage = sections.messages.data ?? EMPTY_MESSAGE_PAGE
  const messages = messagesPage.items

  const visibleEvidence = useMemo(() => {
    if (!search) {
      return evidence
    }

    return evidence.filter((item) =>
      [item.area ?? '', item.type, item.file_url, item.uploaded_by]
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [evidence, search])

  const visibleIssues = useMemo(() => {
    if (!search) {
      return issues
    }

    return issues.filter((item) =>
      [
        item.title,
        item.description ?? '',
        item.severity,
        item.status,
        item.recommendation?.decision ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [issues, search])

  const visibleMessages = useMemo(() => {
    if (!search) {
      return messages
    }

    return messages.filter((item) =>
      [item.sender_type, item.sender_id, item.content].join(' ').toLowerCase().includes(search)
    )
  }, [messages, search])

  const selectedEvidence = useMemo(() => {
    if (!visibleEvidence.length) return null
    return visibleEvidence.find((item) => item.id === selectedEvidenceId) ?? visibleEvidence[0] ?? null
  }, [selectedEvidenceId, visibleEvidence])

  async function refreshWorkspaceNow() {
    setRefreshing(true)
    setRefreshError(null)

    try {
      const nextSummary = await loadWorkspaceSummarySnapshot(caseId, true)
      setSummary(nextSummary)
      setError(null)
      hasLoadedSummaryRef.current = true

      const loadedSections = (Object.entries(sectionStateRef.current) as Array<
        [SectionKey, WorkspaceSectionState<WorkspaceSectionPayloads[SectionKey]>]
      >)
        .filter(([, state]) => state.loaded)
        .map(([section]) => section)

      await Promise.all(loadedSections.map((section) => ensureSectionLoaded(section, { forceRefresh: true })))
    } catch (refreshFailure) {
      const message =
        refreshFailure instanceof Error
          ? refreshFailure.message
          : 'Unable to refresh the checkout workspace.'
      setRefreshError(`${message} Showing the last loaded workspace data.`)
    } finally {
      setRefreshing(false)
    }
  }

  async function refreshWorkspaceSummaryOnly() {
    const nextSummary = await loadWorkspaceSummarySnapshot(caseId, true)
    setSummary(nextSummary)
    setError(null)
    hasLoadedSummaryRef.current = true
    return nextSummary
  }

  function resetIssueForm() {
    setIssueForm(DEFAULT_ISSUE_FORM)
    setIssueError(null)
  }

  function startEditingIssue(issue: EotIssue) {
    setIssueForm({
      issueId: issue.id,
      title: issue.title,
      description: issue.description ?? '',
      severity: issue.severity,
      status: issue.status,
      evidenceIds: issue.linked_evidence.map((item) => item.id),
      decision: issue.recommendation?.decision ?? '',
      rationale: issue.recommendation?.rationale ?? '',
      estimatedCost: issue.recommendation?.estimated_cost ?? '',
    })
    setIssueError(null)
  }

  async function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (evidencePending) return

    if (!evidenceForm.fileUrl.trim()) {
      setEvidenceError('Evidence URL is required.')
      return
    }

    if (!evidenceForm.uploadedBy.trim()) {
      setEvidenceError('Uploaded by is required.')
      return
    }

    let metadata: Record<string, unknown> | null = null
    if (evidenceForm.metadata.trim()) {
      try {
        const parsedMetadata = JSON.parse(evidenceForm.metadata) as unknown
        if (!parsedMetadata || typeof parsedMetadata !== 'object' || Array.isArray(parsedMetadata)) {
          throw new Error('invalid metadata')
        }
        metadata = parsedMetadata as Record<string, unknown>
      } catch {
        setEvidenceError('Evidence metadata must be valid JSON.')
        return
      }
    }

    setEvidencePending(true)
    setEvidenceError(null)

    const payload: CreateEotEvidenceInput = {
      case_id: caseId,
      file_url: evidenceForm.fileUrl.trim(),
      type: evidenceForm.type,
      area: evidenceForm.area.trim() || null,
      uploaded_by: evidenceForm.uploadedBy.trim(),
      metadata,
    }

    try {
      await createEotEvidence(payload)
      setEvidenceForm(DEFAULT_EVIDENCE_FORM(defaultActor))
      await refreshWorkspaceSummaryOnly()
      await ensureSectionLoaded('evidence', { forceRefresh: true })
      if (sectionStateRef.current.timeline.loaded) {
        await ensureSectionLoaded('timeline', { forceRefresh: true })
      }
    } catch (submitError) {
      setEvidenceError(
        submitError instanceof Error ? submitError.message : 'Unable to register evidence.'
      )
    } finally {
      setEvidencePending(false)
    }
  }

  async function handleIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (issuePending) return

    if (!issueForm.title.trim()) {
      setIssueError('Issue title is required.')
      return
    }

    setIssuePending(true)
    setIssueError(null)

    const payload: UpsertEotIssueInput = {
      case_id: caseId,
      issue_id: issueForm.issueId ?? undefined,
      title: issueForm.title.trim() || undefined,
      description: issueForm.description.trim() || null,
      severity: issueForm.severity,
      status: issueForm.status,
      evidence_ids: issueForm.evidenceIds,
      recommendation: {
        decision: issueForm.decision || null,
        rationale: issueForm.rationale.trim() || null,
        estimated_cost: issueForm.estimatedCost.trim() || null,
      },
    }

    try {
      await upsertEotIssue(payload)
      resetIssueForm()
      await refreshWorkspaceSummaryOnly()
      await ensureSectionLoaded('issues', { forceRefresh: true })
      if (sectionStateRef.current.submission.loaded) {
        await ensureSectionLoaded('submission', { forceRefresh: true })
      }
      if (sectionStateRef.current.timeline.loaded) {
        await ensureSectionLoaded('timeline', { forceRefresh: true })
      }
    } catch (submitError) {
      setIssueError(submitError instanceof Error ? submitError.message : 'Unable to save the issue.')
    } finally {
      setIssuePending(false)
    }
  }

  async function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (messagePending) return

    if (!messageForm.senderId.trim()) {
      setMessageError('Sender ID is required.')
      return
    }

    if (!messageForm.content.trim()) {
      setMessageError('Message content is required.')
      return
    }

    let attachments: Array<Record<string, unknown>> = []
    if (messageForm.attachments.trim()) {
      try {
        const parsedAttachments = JSON.parse(messageForm.attachments) as unknown
        if (!Array.isArray(parsedAttachments)) {
          throw new Error('invalid attachments')
        }
        attachments = parsedAttachments as Array<Record<string, unknown>>
      } catch {
        setMessageError('Message attachments must be a valid JSON array.')
        return
      }
    }

    setMessagePending(true)
    setMessageError(null)

    const payload: CreateEotMessageInput = {
      case_id: caseId,
      sender_type: messageForm.senderType,
      sender_id: messageForm.senderId.trim(),
      content: messageForm.content.trim(),
      attachments,
    }

    try {
      await createEotMessage(payload)
      setMessageForm(DEFAULT_MESSAGE_FORM(defaultActor))
      await refreshWorkspaceSummaryOnly()
      await ensureSectionLoaded('messages', { forceRefresh: true })
      if (sectionStateRef.current.timeline.loaded) {
        await ensureSectionLoaded('timeline', { forceRefresh: true })
      }
    } catch (submitError) {
      setMessageError(
        submitError instanceof Error ? submitError.message : 'Unable to send the checkout message.'
      )
    } finally {
      setMessagePending(false)
    }
  }

  function handleToggleSection(section: SectionKey) {
    setOpenSections((current) => {
      const nextOpen = !current[section]

      if (nextOpen) {
        if (section === 'issues' && !sectionStateRef.current.evidence.loaded) {
          void ensureSectionLoaded('evidence')
        }
        void ensureSectionLoaded(section)
      }

      return {
        ...current,
        [section]: nextOpen,
      }
    })
  }

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-4">
          <SkeletonPanel />
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
        <div className="space-y-4">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <SectionCard className="px-6 py-10">
        <EmptyState
          title="Unable to load workspace"
          body={getEotUiErrorMessage(error ?? 'The checkout workspace could not be loaded.')}
        />
      </SectionCard>
    )
  }

  const progress = getCaseProgress(summary.case.status)
  const claimReadiness = getClaimReadiness(summary)

  return (
    <div className="space-y-6">
      {refreshError ? (
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {refreshError}
        </div>
      ) : null}

      <PageHeader
        eyebrow="Checkout workspace"
        title={summary.property.name}
        description={summary.case.summary?.trim() || 'No checkout summary has been recorded yet.'}
        actions={
          <>
            <Link
              href="/eot"
              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to checkouts
            </Link>
            <button
              type="button"
              onClick={() => void refreshWorkspaceNow()}
              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <SectionCard className="px-6 py-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={formatEnumLabel(summary.case.status)} tone={summary.case.status} />
                  <StatusBadge label={formatEnumLabel(summary.case.priority)} tone={summary.case.priority} />
                  <StatusBadge
                    label={claimReadiness.label}
                    tone={
                      claimReadiness.tone === 'ready'
                        ? 'ready_for_claim'
                        : claimReadiness.tone === 'attention'
                          ? 'attention'
                          : 'document'
                    }
                  />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {summary.tenancy.tenant_name}
                  {summary.tenancy.tenant_email ? ` · ${summary.tenancy.tenant_email}` : ''}
                </p>
              </div>

              <ProgressBar
                value={progress}
                label={
                  <>
                    <span>Workflow completion</span>
                    <span>{progress}%</span>
                  </>
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <MetaItem label="Last activity" value={formatDateTime(summary.case.last_activity_at)} />
                <MetaItem
                  label="Deposit"
                  value={
                    summary.tenancy.deposit_amount
                      ? formatCurrency(summary.tenancy.deposit_amount)
                      : 'Not recorded'
                  }
                />
                <MetaItem label="Property reference" value={summary.property.reference || 'Not set'} />
              </div>
            </div>

            <DetailPanel
              title="Operator focus"
              description="Priority items surfaced from current evidence, issues, and output state."
            >
              <KeyValueList
                items={[
                  {
                    label: 'High severity issues',
                    value: summary.metrics.high_severity_open_issue_count || 'None',
                  },
                  {
                    label: 'Evidence logged',
                    value: summary.metrics.evidence_count,
                  },
                  {
                    label: 'Recommendations',
                    value: summary.metrics.recommendation_count,
                  },
                  {
                    label: 'Claim readiness',
                    value: claimReadiness.label,
                  },
                ]}
              />
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                {claimReadiness.description}
              </div>
            </DetailPanel>
          </div>
        </SectionCard>

        <DetailPanel title="Checkout metadata" description="Property, tenancy, and audit context.">
          <KeyValueList
            items={[
              { label: 'Checkout ID', value: summary.case.id.slice(0, 8) },
              { label: 'Created', value: formatDate(summary.case.created_at) },
              {
                label: 'Tenancy dates',
                value: `${formatDate(summary.tenancy.start_date)} to ${formatDate(summary.tenancy.end_date)}`,
              },
              {
                label: 'Address',
                value: formatAddress([
                  summary.property.address_line_1,
                  summary.property.address_line_2,
                  summary.property.city,
                  summary.property.postcode,
                  summary.property.country_code,
                ]),
              },
            ]}
          />
          {summary.tenancy.notes ? (
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
              {summary.tenancy.notes}
            </div>
          ) : null}
        </DetailPanel>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <KPIStatCard label="Evidence" value={summary.metrics.evidence_count} detail="Registered evidence items." />
            <KPIStatCard label="Open issues" value={summary.metrics.open_issue_count} detail="Issues still under operator review." tone="warning" />
            <KPIStatCard label="Resolved issues" value={summary.metrics.resolved_issue_count} detail="Issues already closed out." tone="accent" />
            <KPIStatCard label="Checkout notes" value={summary.metrics.message_count} detail="Logged communication and internal updates." />
          </section>

          <WorkspaceSection
            title="Evidence review"
            description="Preview-first evidence workflow with structured metadata and direct intake controls."
            aside={
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={`${sections.evidence.loaded ? evidence.length : summary.metrics.evidence_count} loaded`}
                  tone="document"
                />
                <StatusBadge label={`${summary.metrics.document_count} documents`} tone="document" />
                <button
                  type="button"
                  onClick={() => handleToggleSection('evidence')}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {openSections.evidence ? 'Hide' : sections.evidence.loaded ? 'Open' : 'Load'}
                  <ChevronDown className={`h-4 w-4 transition ${openSections.evidence ? 'rotate-180' : ''}`} />
                </button>
              </div>
            }
          >
            <SectionBody
              isOpen={openSections.evidence}
              loading={sections.evidence.loading}
              loadingMore={sections.evidence.loadingMore}
              loaded={sections.evidence.loaded}
              error={sections.evidence.error}
              closedPreview="Load this section when you need to review evidence previews or register new files."
              retryLabel="Reload evidence"
              onRetry={() => void ensureSectionLoaded('evidence', { forceRefresh: true })}
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-3">
                  {visibleEvidence.length === 0 ? (
                    <EmptyState
                      title="No evidence recorded"
                      body="Register the first evidence item to begin issue assessment."
                    />
                  ) : (
                    visibleEvidence.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedEvidenceId(item.id)}
                        className={`w-full rounded-[18px] border px-4 py-4 text-left transition ${
                          selectedEvidence?.id === item.id
                            ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${
                            selectedEvidence?.id === item.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <EvidenceIcon type={item.type} />
                          </span>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${selectedEvidence?.id === item.id ? 'text-white' : 'text-slate-950'}`}>
                              {item.area || formatEnumLabel(item.type)}
                            </p>
                            <p className={`mt-1 truncate text-sm ${selectedEvidence?.id === item.id ? 'text-slate-200' : 'text-slate-600'}`}>
                              {item.file_url}
                            </p>
                          </div>
                        </div>
                        <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${selectedEvidence?.id === item.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          <span>{item.uploaded_by}</span>
                          <span>•</span>
                          <span>{formatDateTime(item.created_at)}</span>
                        </div>
                      </button>
                    ))
                  )}
                  {sections.evidence.loaded && evidencePage.has_more ? (
                    <button
                      type="button"
                      onClick={() => void loadMoreSection('evidence')}
                      disabled={sections.evidence.loadingMore}
                      className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
                    >
                      {sections.evidence.loadingMore ? 'Loading more evidence...' : 'Load more evidence'}
                    </button>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {selectedEvidence ? (
                    <SectionCard className="overflow-hidden border-slate-200">
                      <div className="border-b border-slate-200 px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={formatEnumLabel(selectedEvidence.type)} tone={selectedEvidence.type} />
                          {selectedEvidence.area ? (
                            <StatusBadge label={selectedEvidence.area} tone="document" />
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-950">{selectedEvidence.file_url}</p>
                      </div>

                      <div className="px-5 py-5">
                        {selectedEvidence.type === 'image' ? (
                          <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedEvidence.file_url}
                              alt={selectedEvidence.area || 'Evidence preview'}
                              className="h-[360px] w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="rounded-[20px] border border-dashed border-slate-300 bg-[#f8fafc] px-5 py-10 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-slate-600 shadow-sm">
                              <EvidenceIcon type={selectedEvidence.type} />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-950">Preview opens in a new tab</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Use the source link for full-size document or media review.
                            </p>
                            <a
                              href={selectedEvidence.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex items-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
                            >
                              Open source
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        )}

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <MetaItem label="Uploaded by" value={selectedEvidence.uploaded_by} />
                          <MetaItem label="Created" value={formatDateTime(selectedEvidence.created_at)} />
                        </div>

                        {selectedEvidence.metadata ? (
                          <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950">
                            <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-slate-200">
                              {JSON.stringify(selectedEvidence.metadata, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </SectionCard>
                  ) : null}

                  <SectionCard className="px-5 py-5">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-950">Add evidence</h3>
                    </div>
                    <form className="mt-4 grid gap-4" onSubmit={handleEvidenceSubmit}>
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Evidence URL</span>
                        <input
                          required
                          value={evidenceForm.fileUrl}
                          onChange={(event) =>
                            setEvidenceForm((current) => ({ ...current, fileUrl: event.target.value }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                          placeholder="https://..."
                        />
                      </label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm">
                          <span className="font-medium text-slate-700">Type</span>
                          <select
                            value={evidenceForm.type}
                            onChange={(event) =>
                              setEvidenceForm((current) => ({
                                ...current,
                                type: event.target.value as EotEvidenceType,
                              }))
                            }
                            className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                          >
                            {(['document', 'image', 'video'] as EotEvidenceType[]).map((type) => (
                              <option key={type} value={type}>
                                {formatEnumLabel(type)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm">
                          <span className="font-medium text-slate-700">Area</span>
                          <input
                            value={evidenceForm.area}
                            onChange={(event) =>
                              setEvidenceForm((current) => ({ ...current, area: event.target.value }))
                            }
                            className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                            placeholder="Kitchen, hallway, inventory..."
                          />
                        </label>
                      </div>
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Uploaded by</span>
                        <input
                          required
                          value={evidenceForm.uploadedBy}
                          onChange={(event) =>
                            setEvidenceForm((current) => ({ ...current, uploadedBy: event.target.value }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Metadata JSON</span>
                        <textarea
                          value={evidenceForm.metadata}
                          onChange={(event) =>
                            setEvidenceForm((current) => ({ ...current, metadata: event.target.value }))
                          }
                          className="mt-2 min-h-24 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-slate-900"
                          placeholder='{"source":"inventory","page":"12"}'
                        />
                      </label>
                      {evidenceError ? (
                        <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {evidenceError}
                        </p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={evidencePending}
                        className="inline-flex items-center justify-center rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {evidencePending ? 'Saving evidence...' : 'Add evidence'}
                      </button>
                    </form>
                  </SectionCard>
                </div>
              </div>
            </SectionBody>
          </WorkspaceSection>

          <WorkspaceSection
            title="Issues and recommendations"
            description="Link evidence, capture issue responsibility, and record charge recommendations in one review surface."
            aside={
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={`${sections.issues.loaded ? visibleIssues.length : summary.metrics.issue_count} visible`}
                  tone="document"
                />
                {summary.metrics.high_severity_open_issue_count ? (
                  <StatusBadge
                    label={`${summary.metrics.high_severity_open_issue_count} high severity`}
                    tone="risk"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => handleToggleSection('issues')}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {openSections.issues ? 'Hide' : sections.issues.loaded ? 'Open' : 'Load'}
                  <ChevronDown className={`h-4 w-4 transition ${openSections.issues ? 'rotate-180' : ''}`} />
                </button>
              </div>
            }
          >
            <SectionBody
              isOpen={openSections.issues}
              loading={sections.issues.loading}
              loadingMore={sections.issues.loadingMore}
              loaded={sections.issues.loaded}
              error={sections.issues.error}
              closedPreview="Load this section when you need to assess issues, link evidence, or capture recommendation decisions."
              retryLabel="Reload issues"
              onRetry={() => {
                void ensureSectionLoaded('evidence', { forceRefresh: true })
                void ensureSectionLoaded('issues', { forceRefresh: true })
              }}
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="space-y-3">
                  {visibleIssues.length === 0 ? (
                    <EmptyState
                      title="No issues recorded"
                      body="Assess evidence and log the first issue to start recommendation review."
                    />
                  ) : (
                    visibleIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        active={issueForm.issueId === issue.id}
                        onEdit={startEditingIssue}
                      />
                    ))
                  )}
                </div>

                <SectionCard className="px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {issueForm.issueId ? 'Edit issue' : 'Add issue'}
                    </h3>
                    {issueForm.issueId ? (
                      <button
                        type="button"
                        onClick={resetIssueForm}
                        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                      >
                        Clear selection
                      </button>
                    ) : null}
                  </div>

                  <form className="mt-4 grid gap-4" onSubmit={handleIssueSubmit}>
                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Issue title</span>
                      <input
                        required
                        value={issueForm.title}
                        onChange={(event) =>
                          setIssueForm((current) => ({ ...current, title: event.target.value }))
                        }
                        className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        placeholder="Damage, cleaning, missing item..."
                      />
                    </label>

                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Description</span>
                      <textarea
                        value={issueForm.description}
                        onChange={(event) =>
                          setIssueForm((current) => ({ ...current, description: event.target.value }))
                        }
                        className="mt-2 min-h-28 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-slate-900"
                        placeholder="What happened, where, and why does it matter?"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Severity</span>
                        <select
                          value={issueForm.severity}
                          onChange={(event) =>
                            setIssueForm((current) => ({
                              ...current,
                              severity: event.target.value as EotIssueSeverity,
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        >
                          {(['low', 'medium', 'high'] as EotIssueSeverity[]).map((severity) => (
                            <option key={severity} value={severity}>
                              {formatEnumLabel(severity)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Status</span>
                        <select
                          value={issueForm.status}
                          onChange={(event) =>
                            setIssueForm((current) => ({
                              ...current,
                              status: event.target.value as EotIssueStatus,
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        >
                          {(['open', 'resolved', 'disputed'] as EotIssueStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {formatEnumLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Link evidence</span>
                      <div className="mt-2 grid gap-2">
                        {sections.evidence.loading && !sections.evidence.loaded ? (
                          <p className="rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm text-slate-500">
                            Loading evidence options...
                          </p>
                        ) : evidence.length === 0 ? (
                          <p className="rounded-[14px] border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                            Add evidence first to link it to this issue.
                          </p>
                        ) : (
                          evidence.map((evidenceItem) => {
                            const checked = issueForm.evidenceIds.includes(evidenceItem.id)

                            return (
                              <label
                                key={evidenceItem.id}
                                className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-3 py-3"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setIssueForm((current) => ({
                                      ...current,
                                      evidenceIds: checked
                                        ? current.evidenceIds.filter((id) => id !== evidenceItem.id)
                                        : [...current.evidenceIds, evidenceItem.id],
                                    }))
                                  }
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900">
                                    {evidenceItem.area || formatEnumLabel(evidenceItem.type)}
                                  </p>
                                  <p className="truncate text-sm text-slate-500">{evidenceItem.file_url}</p>
                                </div>
                              </label>
                            )
                          })
                        )}
                        {sections.evidence.loaded && evidencePage.has_more ? (
                          <button
                            type="button"
                            onClick={() => void loadMoreSection('evidence')}
                            disabled={sections.evidence.loadingMore}
                            className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
                          >
                            {sections.evidence.loadingMore
                              ? 'Loading more evidence options...'
                              : 'Load more evidence options'}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Recommendation</span>
                        <select
                          value={issueForm.decision}
                          onChange={(event) =>
                            setIssueForm((current) => ({
                              ...current,
                              decision: event.target.value as EotRecommendationDecision | '',
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                        >
                          <option value="">No recommendation yet</option>
                          {(['charge', 'partial', 'no_charge'] as EotRecommendationDecision[]).map(
                            (decision) => (
                              <option key={decision} value={decision}>
                                {formatEnumLabel(decision)}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                      <label className="text-sm">
                        <span className="font-medium text-slate-700">Estimated cost</span>
                        <input
                          value={issueForm.estimatedCost}
                          onChange={(event) =>
                            setIssueForm((current) => ({
                              ...current,
                              estimatedCost: event.target.value,
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 text-slate-900"
                          placeholder="250.00"
                        />
                      </label>
                    </div>

                    <label className="text-sm">
                      <span className="font-medium text-slate-700">Recommendation rationale</span>
                      <textarea
                        value={issueForm.rationale}
                        onChange={(event) =>
                          setIssueForm((current) => ({ ...current, rationale: event.target.value }))
                        }
                        className="mt-2 min-h-24 w-full rounded-[14px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-slate-900"
                        placeholder="Explain liability, confidence, and proportionality."
                      />
                    </label>

                    {issueError ? (
                      <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {issueError}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={issuePending}
                        className="inline-flex items-center justify-center rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {issuePending ? 'Saving issue...' : issueForm.issueId ? 'Update issue' : 'Add issue'}
                      </button>
                      {issueForm.issueId ? (
                        <button
                          type="button"
                          onClick={resetIssueForm}
                          className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                </SectionCard>
              </div>
            </SectionBody>
          </WorkspaceSection>

          <WorkspaceSection
            title="Submission review"
            description="Review the checkout submission in a document-style layout with traceability back to evidence and issue decisions."
            aside={
              <div className="flex flex-wrap items-center gap-2">
                {summary.claim ? (
                  <StatusBadge label="Claim generated" tone="ready_for_claim" />
                ) : (
                  <StatusBadge label={claimReadiness.label} tone="document" />
                )}
                <button
                  type="button"
                  onClick={() => handleToggleSection('submission')}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {openSections.submission ? 'Hide' : sections.submission.loaded ? 'Open' : 'Load'}
                  <ChevronDown className={`h-4 w-4 transition ${openSections.submission ? 'rotate-180' : ''}`} />
                </button>
              </div>
            }
          >
            <SectionBody
              isOpen={openSections.submission}
              loading={sections.submission.loading}
              loadingMore={sections.submission.loadingMore}
              loaded={sections.submission.loaded}
              error={sections.submission.error}
              closedPreview="Load this section when you need the claim breakdown and issue traceability."
              retryLabel="Reload submission"
              onRetry={() => void ensureSectionLoaded('submission', { forceRefresh: true })}
            >
              {submission?.claim ? (
                <div className="space-y-5">
                  <div className="rounded-[22px] border border-slate-200 bg-white px-6 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Submission
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                          {formatCurrency(submission.claim.total_amount)}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Generated {formatDateTime(submission.claim.generated_at)} and updated{' '}
                          {formatDateTime(submission.claim.updated_at)}.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge label="Claim generated" tone="ready_for_claim" />
                        <StatusBadge label={`${submission.issues.length} source issues`} tone="document" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <SectionCard className="overflow-hidden">
                      <div className="border-b border-slate-200 px-5 py-4">
                        <h3 className="text-sm font-semibold text-slate-950">Breakdown</h3>
                      </div>
                      <div className="overflow-hidden rounded-b-[24px] bg-slate-950">
                        <pre className="overflow-x-auto px-5 py-5 text-xs leading-6 text-slate-200">
                          {JSON.stringify(submission.claim.breakdown, null, 2)}
                        </pre>
                      </div>
                    </SectionCard>

                    <DetailPanel title="Traceability" description="Recommended charges and supporting evidence.">
                      {submission.issues.length === 0 ? (
                        <EmptyState
                          title="No issue traceability"
                          body="Issues will appear here once they are linked to the claim package."
                        />
                      ) : (
                        submission.issues.map((issue) => (
                          <div key={issue.id} className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
                              {issue.recommendation?.decision ? (
                                <StatusBadge
                                  label={formatEnumLabel(issue.recommendation.decision)}
                                  tone={issue.recommendation.decision}
                                />
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-950">{issue.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {issue.recommendation?.rationale || issue.description || 'No narrative recorded.'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {issue.linked_evidence.map((item) => (
                                <StatusBadge
                                  key={item.id}
                                  label={item.area || formatEnumLabel(item.type)}
                                  tone={item.type}
                                />
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </DetailPanel>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title={claimReadiness.label}
                  body={claimReadiness.description}
                  action={
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <TriangleAlert className="h-4 w-4" />
                      Track issue recommendations and move the case to ready-for-claim when the file is complete.
                    </div>
                  }
                />
              )}
            </SectionBody>
          </WorkspaceSection>
        </div>

        <div className="space-y-6">
          <WorkspaceSection
            title="Activity timeline"
            description="Most recent case events across intake, evidence, issue review, and messaging."
            aside={
              <button
                type="button"
                onClick={() => handleToggleSection('timeline')}
                className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                {openSections.timeline ? 'Hide' : sections.timeline.loaded ? 'Open' : 'Load'}
                <ChevronDown className={`h-4 w-4 transition ${openSections.timeline ? 'rotate-180' : ''}`} />
              </button>
            }
          >
            <SectionBody
              isOpen={openSections.timeline}
              loading={sections.timeline.loading}
              loadingMore={sections.timeline.loadingMore}
              loaded={sections.timeline.loaded}
              error={sections.timeline.error}
              closedPreview="Load this section when you need the recent case event stream."
              retryLabel="Reload timeline"
              onRetry={() => void ensureSectionLoaded('timeline', { forceRefresh: true })}
            >
              <ActivityTimeline
                items={timeline.map((item) => ({
                  id: item.id,
                  title: item.title,
                  detail: item.detail,
                  meta: item.meta,
                  tone: item.tone as 'accent' | 'default' | 'warning' | 'danger',
                }))}
              />
            </SectionBody>
          </WorkspaceSection>

          <WorkspaceSection
            title="Supporting documents"
            description="Linked checkout documents and document records."
            aside={
              <div className="flex items-center gap-2">
                <StatusBadge label={`${summary.metrics.document_count} documents`} tone="document" />
                <button
                  type="button"
                  onClick={() => handleToggleSection('documents')}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {openSections.documents ? 'Hide' : sections.documents.loaded ? 'Open' : 'Load'}
                  <ChevronDown className={`h-4 w-4 transition ${openSections.documents ? 'rotate-180' : ''}`} />
                </button>
              </div>
            }
          >
            <SectionBody
              isOpen={openSections.documents}
              loading={sections.documents.loading}
              loadingMore={sections.documents.loadingMore}
              loaded={sections.documents.loaded}
              error={sections.documents.error}
              closedPreview="Load this section when you need linked checkout documents."
              retryLabel="Reload documents"
              onRetry={() => void ensureSectionLoaded('documents', { forceRefresh: true })}
            >
              {documents.length === 0 ? (
                <EmptyState
                  title="No supporting documents"
                  body="This checkout does not yet have linked document records."
                />
              ) : (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <a
                      key={document.id}
                      href={document.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[18px] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{document.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatEnumLabel(document.document_type)}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </div>
                    </a>
                  ))}
                  {sections.documents.loaded && documentsPage.has_more ? (
                    <button
                      type="button"
                      onClick={() => void loadMoreSection('documents')}
                      disabled={sections.documents.loadingMore}
                      className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
                    >
                      {sections.documents.loadingMore ? 'Loading more documents...' : 'Load more documents'}
                    </button>
                  ) : null}
                </div>
              )}
            </SectionBody>
          </WorkspaceSection>

          <WorkspaceSection
            title="Checkout notes and communication"
            description="Internal operator updates and outbound checkout communication log."
            aside={
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={`${sections.messages.loaded ? messages.length : summary.metrics.message_count} loaded`}
                  tone="document"
                />
                <button
                  type="button"
                  onClick={() => handleToggleSection('messages')}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {openSections.messages ? 'Hide' : sections.messages.loaded ? 'Open' : 'Load'}
                  <ChevronDown className={`h-4 w-4 transition ${openSections.messages ? 'rotate-180' : ''}`} />
                </button>
              </div>
            }
          >
            <SectionBody
              isOpen={openSections.messages}
              loading={sections.messages.loading}
              loadingMore={sections.messages.loadingMore}
              loaded={sections.messages.loaded}
              error={sections.messages.error}
              closedPreview="Load this section when you need the communication history or want to add a new note."
              retryLabel="Reload notes"
              onRetry={() => void ensureSectionLoaded('messages', { forceRefresh: true })}
            >
              <div className="space-y-3">
                {visibleMessages.length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    body="Checkout notes and outbound communication will appear here."
                  />
                ) : (
                  visibleMessages.map((message) => (
                    <div key={message.id} className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={formatEnumLabel(message.sender_type)} tone={message.sender_type} />
                        <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          {formatDateTime(message.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{message.content}</p>
                    </div>
                  ))
                )}
                {sections.messages.loaded && messagesPage.has_more ? (
                  <button
                    type="button"
                    onClick={() => void loadMoreSection('messages')}
                    disabled={sections.messages.loadingMore}
                    className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
                  >
                    {sections.messages.loadingMore ? 'Loading more notes...' : 'Load more notes'}
                  </button>
                ) : null}
              </div>

              <form className="mt-4 grid gap-4" onSubmit={handleMessageSubmit}>
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-950">Add checkout note</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="font-medium text-slate-700">Sender type</span>
                    <select
                      value={messageForm.senderType}
                      onChange={(event) =>
                        setMessageForm((current) => ({
                          ...current,
                          senderType: event.target.value as EotMessageSenderType,
                        }))
                      }
                      className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-slate-900"
                    >
                      {(['manager', 'landlord', 'tenant'] as EotMessageSenderType[]).map((senderType) => (
                        <option key={senderType} value={senderType}>
                          {formatEnumLabel(senderType)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="font-medium text-slate-700">Sender ID</span>
                    <input
                      required
                      value={messageForm.senderId}
                      onChange={(event) =>
                        setMessageForm((current) => ({ ...current, senderId: event.target.value }))
                      }
                      className="mt-2 h-11 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-slate-900"
                    />
                  </label>
                </div>

                <label className="text-sm">
                  <span className="font-medium text-slate-700">Message</span>
                  <textarea
                    required
                    value={messageForm.content}
                    onChange={(event) =>
                      setMessageForm((current) => ({ ...current, content: event.target.value }))
                    }
                    className="mt-2 min-h-24 w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-900"
                    placeholder="Record an operator note or outbound case update."
                  />
                </label>

                <label className="text-sm">
                  <span className="font-medium text-slate-700">Attachments JSON</span>
                  <textarea
                    value={messageForm.attachments}
                    onChange={(event) =>
                      setMessageForm((current) => ({ ...current, attachments: event.target.value }))
                    }
                    className="mt-2 min-h-20 w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-slate-900"
                    placeholder='[{"name":"invoice.pdf","url":"https://..."}]'
                  />
                </label>

                {messageError ? (
                  <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {messageError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={messagePending}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {messagePending ? 'Saving note...' : 'Add case note'}
                </button>
              </form>
            </SectionBody>
          </WorkspaceSection>
        </div>
      </div>
    </div>
  )
}
