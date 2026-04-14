'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Mail,
  X,
  Save,
  Variable,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/app/operator-ui'
import { cn } from '@/lib/ui'
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_VARIABLES,
  type CommunicationTemplate,
  type TemplateCategory,
  type CreateTemplateInput,
} from '@/lib/communication-hub-types'

/* ────────────────────────────────────────────────────────────── */
/*  Template form (create / edit)                                  */
/* ────────────────────────────────────────────────────────────── */

function TemplateForm({
  template,
  onSaved,
  onCancel,
}: {
  template: CommunicationTemplate | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(template?.name ?? '')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [category, setCategory] = useState<TemplateCategory>(
    template?.category ?? 'general'
  )
  const [saving, setSaving] = useState(false)

  function insertVariable(key: string) {
    setBody((prev) => prev + key)
  }

  async function handleSave() {
    if (!name.trim() || !body.trim()) {
      toast.error('Name and body are required.')
      return
    }

    setSaving(true)
    try {
      const payload: CreateTemplateInput = {
        name: name.trim(),
        subject: subject.trim() || null,
        body: body.trim(),
        category,
      }

      const url = template
        ? `/api/operator/communications/templates/${template.id}`
        : '/api/operator/communications/templates'

      const res = await fetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to save')
      }

      toast.success(
        template ? 'Template updated.' : 'Template created.'
      )
      onSaved()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save template.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">
          {template ? 'Edit Template' : 'New Template'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deposit Deduction Notice"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
          <div className="w-48">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            >
              {TEMPLATE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Optional email subject"
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Template Body
            </label>
            <span className="text-[10px] text-zinc-400">
              Use variables below to insert dynamic fields
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Dear {{tenant_name}},&#10;&#10;We are writing regarding your tenancy at {{property_address}}..."
            rows={10}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
        </div>

        {/* Variable insertion buttons */}
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            <Variable className="h-3 w-3" />
            Insert Variable
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="inline-flex h-7 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-[11px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100/80 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim() || !body.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : template ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Template card                                                  */
/* ────────────────────────────────────────────────────────────── */

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onCopy,
  onUse,
}: {
  template: CommunicationTemplate
  onEdit: () => void
  onDelete: () => void
  onCopy: () => void
  onUse: () => void
}) {
  const categoryLabel =
    TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label ??
    template.category

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950 [overflow-wrap:anywhere]">
          {template.name}
        </h4>
        <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
          {categoryLabel}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-zinc-500 [overflow-wrap:anywhere]">
        {template.subject || template.body}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onUse}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Mail className="h-3 w-3" />
          Use Template
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          title="Edit"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-rose-600"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Template panel (main export)                                   */
/* ────────────────────────────────────────────────────────────── */

export function TemplatePanel() {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CommunicationTemplate | null>(null)
  const [creating, setCreating] = useState(false)
  const [filterCategory, setFilterCategory] = useState<
    TemplateCategory | 'all'
  >('all')

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/operator/communications/templates')
      if (!res.ok) throw new Error('Failed to fetch')

      const data = (await res.json()) as {
        templates: CommunicationTemplate[]
      }
      setTemplates(data.templates)
    } catch {
      toast.error('Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  async function handleDelete(id: string) {
    try {
      const res = await fetch(
        `/api/operator/communications/templates/${id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Template deleted.')
      fetchTemplates()
    } catch {
      toast.error('Failed to delete template.')
    }
  }

  async function handleDuplicate(template: CommunicationTemplate) {
    try {
      const res = await fetch('/api/operator/communications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (copy)`,
          subject: template.subject,
          body: template.body,
          category: template.category,
          variables: template.variables,
        }),
      })
      if (!res.ok) throw new Error('Failed to duplicate')
      toast.success('Template duplicated.')
      fetchTemplates()
    } catch {
      toast.error('Failed to duplicate template.')
    }
  }

  const filtered =
    filterCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === filterCategory)

  if (creating || editing) {
    return (
      <TemplateForm
        template={editing}
        onSaved={() => {
          setEditing(null)
          setCreating(false)
          fetchTemplates()
        }}
        onCancel={() => {
          setEditing(null)
          setCreating(false)
        }}
      />
    )
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={cn(
              'inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition',
              filterCategory === 'all'
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            )}
          >
            All
          </button>
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilterCategory(c.value)}
              className={cn(
                'inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition',
                filterCategory === c.value
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-3 w-3" />
          New Template
        </button>
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl border border-zinc-200 bg-white px-5 py-4"
            >
              <div className="h-4 w-2/3 rounded bg-zinc-100" />
              <div className="mt-3 h-3 w-1/3 rounded bg-zinc-100" />
              <div className="mt-4 space-y-2">
                <div className="h-3 rounded bg-zinc-50" />
                <div className="h-3 w-3/4 rounded bg-zinc-50" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <EmptyState
            title="No templates yet"
            body="Create reusable message templates for tenant notices, landlord updates, and more."
            action={
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                <Plus className="h-3.5 w-3.5" />
                Create your first template
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => setEditing(template)}
              onDelete={() => handleDelete(template.id)}
              onCopy={() => handleDuplicate(template)}
              onUse={() => {
                toast.success(`Template "${template.name}" copied to clipboard.`)
                navigator.clipboard.writeText(template.body).catch(() => {})
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
