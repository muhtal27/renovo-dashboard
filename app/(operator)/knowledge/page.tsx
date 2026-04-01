import type { Metadata } from 'next'
import KnowledgeClient, {
  type KnowledgeArticle,
} from '@/app/knowledge/knowledge-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Guidance | Renovo AI',
}

const GUIDANCE_ARTICLES: KnowledgeArticle[] = [
  {
    title: 'Fair wear and tear',
    category: 'Dispute Handling',
    regions: ['all', 'england', 'wales', 'scotland'],
    summary:
      'Normal deterioration from reasonable use should not be treated as tenant-caused damage. Age, quality, tenancy length, and occupancy all matter when deciding whether a mark, worn surface, or faded finish is ordinary use or a compensable loss.',
    content: `**Practical summary**
Normal wear from everyday living is not usually recoverable from the deposit. Managers should look at age, quality, tenancy length, occupancy, and how heavily an item was used before deciding whether a loss goes beyond ordinary deterioration.

**Practical examples**
- Carpet pile flattening in a main walkway is usually wear and tear, while a fresh burn or heavy staining is more likely to be damage.
- Light wall scuffs after a longer tenancy may be ordinary use, while holes, gouges, or unauthorised decoration are more likely to justify a deduction.

**What evidence to gather**
- Signed check in inventory with condition notes and dated photos.
- Check out report showing the same room, item, or surface at tenancy end.
- Tenancy length, occupancy details, and any repair history that affects expected lifespan.

**Common mistakes**
- Treating an older item as if it was new at check in.
- Relying on end-of-tenancy photos without a clear starting baseline.

**What to remember**
1. Ask what normal use would look like over this tenancy length.
2. Link every deduction to a before-and-after evidence trail.
3. Keep betterment in mind if the item was already ageing.`,
    sourceLabel: 'mydeposits',
    sourceHref:
      'https://www.mydeposits.co.uk/content-hub/fair-wear-and-tear-what-is-it-and-how-is-it-applied/',
  },
  {
    title: 'Betterment',
    category: 'Deposit Schemes',
    regions: ['all', 'england', 'wales', 'scotland'],
    summary:
      'A deduction should put the landlord back in the position they should reasonably have been in, not leave them with something newer or better at the tenant’s expense. Older items usually justify a reduced, proportionate award rather than full replacement cost.',
    content: `**Practical summary**
Betterment means improving the landlord's position beyond the condition they could reasonably expect at tenancy end. Deposit awards should usually reflect age, quality, and likely remaining life rather than the full cost of buying a brand-new replacement.

**Practical examples**
- Replacing a five-year-old carpet with a new one rarely supports a full claim for the whole invoice.
- If a cupboard door can be repaired safely, a full kitchen replacement cost will usually be hard to justify.

**What evidence to gather**
- Age and original quality of the item.
- Repair and replacement quotes so proportionality can be explained.
- Before and after evidence showing why cleaning or repair would not solve the issue.

**Common mistakes**
- Claiming new-for-old costs with no allowance for age or use.
- Skipping evidence on why replacement was necessary instead of repair or cleaning.

**What to remember**
1. Lifespan estimates are commonly used reference points, not fixed rules.
2. Cleaning issues are different from depreciation and replacement issues.
3. Show how the figure was reduced to avoid betterment.`,
    sourceLabel: 'mydeposits',
    sourceHref:
      'https://www.mydeposits.co.uk/content-hub/rules-of-claiming-for-deposit-deductions/',
  },
  {
    title: 'Evidence checklist',
    category: 'Evidence and Documentation',
    regions: ['all', 'england', 'wales', 'scotland'],
    summary:
      'Strong deposit decisions are usually document-led. Schemes expect evidence that is specific to the disputed issue and easy to match back to the tenancy, the item, and the claimed amount.',
    content: `**Practical summary**
Good evidence is specific, dated, and easy to follow. Managers should organise the file so each proposed deduction can be traced back to the tenancy agreement, inventories, photos, and any supporting invoices or notes.

**What evidence to gather**
- Tenancy agreement, signed check in inventory, and check out report.
- Dated photos, invoices or quotes, and a rent statement if arrears are part of the claim.
- Relevant correspondence or notes only, not a full inbox export.

**Practical examples**
- A rent arrears claim is stronger when the statement clearly shows the person, property, period, and balance calculation.
- Damage claims are easier to defend when photos are labelled to the room, item, and report entry.

**Common mistakes**
- Submitting large bundles of irrelevant material that do not relate to the issue in dispute.
- Using unlabelled photos with no explanation of what the reviewer is meant to see.

**What to remember**
1. The file should explain itself without extra verbal context.
2. Group evidence by issue and amount.
3. If a document does not support a deduction, leave it out of the main bundle.`,
    sourceLabel: 'DPS',
    sourceHref:
      'https://www.depositprotection.com/disputes/how-to-have-a-successful-tenancy-from-start-to-finish/gathering-evidence',
  },
  {
    title: 'Deposit dispute process',
    category: 'Deposit Schemes',
    regions: ['england', 'wales'],
    summary:
      'In England and Wales, deposit schemes offer free dispute resolution when the parties cannot agree on deductions. The decision turns heavily on the written evidence, so a thin file is usually harder to defend than a well-linked case pack.',
    content: `**Practical summary**
Scheme adjudication is usually a document-based process. Once the parties cannot agree, the quality and organisation of the written evidence becomes central to the outcome.

**Practical examples**
- If a landlord and tenant disagree about cleaning or damage, both sides can submit documentary evidence to the scheme.
- A claim with clear reports, dated photos, and invoices is easier to assess than a broad narrative with no supporting documents.

**What evidence to gather**
- The proposed repayment split and the reason for each deduction.
- Issue-specific reports, photos, invoices, and any relevant tenancy clauses.
- A clean chronology of what happened at tenancy end.

**Common mistakes**
- Assuming the scheme will ask for missing evidence later.
- Raising a dispute without first organising the evidence by issue and amount.

**What to remember**
1. Evidence windows are typically time-limited.
2. Clear line-by-line explanations reduce avoidable back and forth.
3. A weaker claim can often be narrowed before it reaches formal adjudication.`,
    sourceLabel: 'TDS',
    sourceHref:
      'https://custodial.tenancydepositscheme.com/tools-and-guides/faqs/tenants/what-evidence-do-i-need-to-submit/',
  },
  {
    title: 'Compliance basics',
    category: 'Deposit Schemes',
    regions: ['england'],
    summary:
      'Deposit protection details are not just admin. In England and Wales the deposit must be protected promptly and the tenant must receive the prescribed information, including scheme details and how disputes are handled.',
    content: `**Practical summary**
Deposit protection records should be part of the end-of-tenancy file, not kept separately. If the scheme details, timing, or prescribed information trail are unclear, the landlord's position is harder to defend before any deduction is even assessed.

**What evidence to gather**
- Deposit protection certificate or confirmation.
- Date the deposit was received and date it was protected.
- Copy of the prescribed information pack given to the tenant.

**Practical examples**
- At tenancy end, scheme name and reference details make it much easier to move quickly into repayment or dispute resolution.
- Missing prescribed information can complicate the position before the deduction evidence is reviewed.

**Common mistakes**
- Treating deposit scheme details as separate from the tenancy-end evidence bundle.
- Starting a claim without confirming the scheme record and prescribed information trail.

**What to remember**
1. Compliance paperwork supports the deduction process.
2. Scheme details should be easy to find in the file.
3. If the record is incomplete, fix the file position before escalating a dispute.`,
    sourceLabel: 'GOV.UK',
    sourceHref:
      'https://www.gov.uk/tenancy-deposit-protection/information-landlords-must-give-tenants',
  },
  {
    title: 'Scotland notes',
    category: 'Scotland',
    regions: ['scotland'],
    summary:
      'Scottish tenancy deposit processes follow Scotland-specific scheme rules. Managers should check the approved Scottish scheme guidance and use the tenancy location as the starting point before applying any process assumptions from England and Wales.',
    content: `**Practical summary**
Scottish tenancy-end handling often uses the same practical evidence standards as elsewhere in the UK, but the surrounding process rules are Scotland-specific. Managers should start with the tenancy location, the approved scheme record, and the current Scottish guidance before proposing deductions.

**What evidence to gather**
- Deposit protection confirmation showing the approved Scottish scheme used.
- Tenancy location, tenancy start date, and any scheme correspondence about return or dispute steps.
- The core tenancy evidence pack: agreement, inventories, check out report, dated photos, and invoices where relevant.

**Common mistakes**
- Assuming England and Wales scheme steps apply unchanged to a Scottish tenancy.
- Proceeding without checking the scheme process for the tenancy location.

**What to remember**
1. Scotland-specific scheme steps can affect timings and evidence handling.
2. The same evidence quality standards still matter.
3. Check the scheme process before sending deduction proposals.`,
    sourceLabel: 'mygov.scot',
    sourceHref: 'https://www.mygov.scot/landlord-deposit/protection',
  },
  {
    title: 'Private Residential Tenancy — Scotland',
    category: 'Scotland',
    regions: ['scotland'],
    summary:
      'The Private Residential Tenancy applies to most new private tenancies in Scotland from 1 December 2017. This guide explains what it means for end-of-tenancy handling and deposit disputes.',
    content: `**Practical summary**
Most new private tenancies in Scotland from 1 December 2017 are private residential tenancies. They are open-ended rather than fixed-term in the usual sense, tenants can normally leave by giving notice, and landlords must rely on statutory grounds if they want possession.

**What this means at tenancy end**
- There is no Section 21 equivalent in Scotland.
- Older assured or short assured tenancies did not automatically convert just because the new regime started.
- Evidence gathering and deduction assessment still matter in the same practical way at tenancy end.

**Operational impact**
- Managers should confirm the tenancy type before relying on notices or process assumptions.
- Deposit claims still depend on inventories, check out evidence, photos, and proportionate deduction reasoning.
- The legal framework around possession and notice is different from England and Wales, so guidance should be checked for the tenancy location.

**What to remember**
1. PRT status affects the tenancy framework, not the need for strong end-of-tenancy evidence.
2. Check the tenancy start date and tenancy type first.
3. Keep legal process questions separate from deduction evidence analysis.`,
    sourceLabel: 'GOV.SCOT',
    sourceHref:
      'https://www.gov.scot/publications/private-residential-tenancies-tenants-guide/',
  },
  {
    title: 'Safe Deposits Scotland — How Disputes Work',
    category: 'Scotland',
    regions: ['scotland'],
    summary:
      'A practical guide to how disputes are handled through Safe Deposits Scotland, including evidence expectations and what managers should prepare before raising a dispute.',
    content: `**Practical summary**
When deductions are disputed, both parties may be invited to submit evidence through the scheme process. Preparation matters because evidence windows are typically time-limited, and timings can vary by scheme process and how complete the submissions are.

**Evidence that usually carries the most weight**
- Signed check in report.
- Check out report tied to the same rooms or items.
- Dated photos.
- Invoices or repair quotes.
- Clear written deduction summary and relevant communication records.

**Practical approach**
- Prepare the evidence pack before a dispute is raised if possible.
- Keep the written deduction schedule concise and line-by-line.
- Make sure each amount can be traced back to the supporting document.

**Common mistakes**
- Uploading large files with no explanation of what each item proves.
- Relying on narrative alone without before-and-after evidence.

**What to remember**
1. Evidence quality matters more than volume.
2. Scheme timelines can vary, so avoid leaving preparation until the last minute.
3. A well-organised deduction summary makes adjudication easier.`,
    sourceLabel: 'SafeDeposits Scotland',
    sourceHref: 'https://www.safedepositsscotland.com/',
  },
  {
    title: 'First-tier Tribunal Scotland — Housing and Property Chamber',
    category: 'Scotland',
    regions: ['scotland'],
    summary:
      'When the First-tier Tribunal becomes relevant in Scottish tenancy and deposit matters, and how it differs from scheme adjudication.',
    content: `**Practical summary**
The First-tier Tribunal for Scotland (Housing and Property Chamber) is the formal forum for many landlord-tenant disputes in Scotland. Scheme adjudication and tribunal proceedings are different processes, and managers should not assume one is simply an appeal route from the other.

**Where it may become relevant**
- Deposit-protection non-compliance.
- Formal tenancy disputes.
- Some higher-stakes or contested matters where a scheme process is not the correct route.

**Operational impact**
- Tribunal proceedings are usually more formal and slower than ordinary scheme dispute handling.
- Evidence should still be organised carefully, but managers should check the relevant scheme rules and legal advice where escalation is being considered.
- Keep notes clear if a matter might move beyond ordinary scheme adjudication.

**What to remember**
1. Scheme adjudication and tribunal proceedings are different processes.
2. Check the correct forum before escalating.
3. More formal proceedings usually require more careful preparation and timescales.`,
    sourceLabel: 'Housing & Property Chamber',
    sourceHref: 'https://housingandpropertychamber.scot/',
  },
  {
    title: 'Tenancy Deposit Protection — Scotland',
    category: 'Scotland',
    regions: ['scotland'],
    summary:
      'The key rules for deposit protection in Scotland, the approved schemes, and what non-compliance means at the end of a tenancy.',
    content: `**Practical summary**
Scottish tenancy deposits generally need to be protected within 30 working days of the tenancy starting. Tenants must also be given the required scheme information so the protection position is clear from the outset.

**Approved schemes**
- Safe Deposits Scotland.
- Letting Protection Service Scotland.
- mydeposits Scotland.

**Why this matters at tenancy end**
- Non-compliance can create financial penalty risk.
- It can leave the landlord or agent in a weaker position when the tenancy ends.
- Dispute handling becomes more difficult if scheme information was not dealt with correctly.

**What to remember**
1. Deposit protection and scheme information should be checked before any tenancy-end proposal is sent.
2. Keep the scheme name, reference, and protection date in the case file.
3. If the record is incomplete, fix that first before pushing into dispute handling.`,
    sourceLabel: 'mygov.scot',
    sourceHref: 'https://www.mygov.scot/landlord-deposit/protection',
  },
  {
    title: 'Fair Wear and Tear in Scotland',
    category: 'Scotland',
    regions: ['scotland'],
    summary:
      'How fair wear and tear is assessed in Scotland, including the practical importance of tenancy length, evidence quality, and betterment.',
    content: `**Practical summary**
The core principle in Scotland is broadly similar to England and Wales: tenants are not usually liable for normal deterioration caused by reasonable use. In practice, longer-running private residential tenancies can make tenancy length especially important when deciding whether a loss is ordinary use or damage.

**Practical examples**
- An older carpet in a long tenancy may justify only a reduced award even where staining is proven.
- Paint scuffs may be ordinary use, but larger gouges or unauthorised decoration can justify a claim.
- Condensation and mould issues in older properties may involve shared responsibility rather than a simple tenant-damage conclusion.

**What evidence to gather**
- Check in inventory and photos showing baseline condition and age.
- Check out report and dated photographs from the same areas.
- Repair history, ventilation notes, and any communication that affects responsibility.

**What to remember**
1. Tenancy length often carries real weight in Scotland.
2. Evidence quality remains critical.
3. Betterment still matters even when the damage itself is proven.`,
    sourceLabel: 'mydeposits',
    sourceHref:
      'https://www.mydeposits.co.uk/content-hub/fair-wear-and-tear-what-is-it-and-how-is-it-applied/',
  },
  {
    title: 'Letting Agent Regulation in Scotland',
    category: 'Scotland',
    regions: ['scotland'],
    summary:
      'The Scottish letting agent registration and Code of Practice framework, and why strong records matter at the end of a tenancy.',
    content: `**Practical summary**
Scottish letting agents must comply with the relevant registration and Code of Practice framework. At tenancy end, the operational themes are clear: good record keeping, transparent communication, and evidence-backed decisions matter.

**What matters in practice**
- Keep a clear record of instructions, inspections, and communications.
- Explain proposed deductions in a factual, structured way.
- Make sure any claim is backed by inventories, photos, and repair or replacement evidence.

**Why the audit trail matters**
- It supports transparent end-of-tenancy handling.
- It makes manager review easier.
- It reduces the risk of having to reconstruct reasoning later if the decision is challenged.

**What to remember**
1. Registration and Code obligations reinforce the need for strong records.
2. Clear communication supports fairer outcomes.
3. An audit trail is operationally useful, not just a compliance exercise.`,
    sourceLabel: 'Letting Agent Register',
    sourceHref: 'https://lettingagentregistration.gov.scot/about',
  },
  {
    title: 'Betterment — How to Apply It to Deposit Claims',
    category: 'Deposit Schemes',
    regions: ['all', 'england', 'wales', 'scotland'],
    summary:
      'How betterment works in practice, with examples for carpets, decorating, and appliances.',
    content: `**Practical summary**
Betterment means awarding more than the landlord's reasonable loss. Full replacement cost is often not appropriate where the item was already used, ageing, or near the end of its ordinary lifespan.

**Common proportionality examples**
- Carpet: a common reference point for a mid-range carpet might be a multi-year lifespan, but this is only a guide and not a fixed rule.
- Decoration: older paintwork may justify only a partial contribution even where fresh damage is proven.
- Appliances: replacement cost may need to be reduced significantly where the appliance was already several years old.

**What evidence to gather**
- Age, quality, and prior condition of the item.
- Repair versus replacement options.
- Clear explanation of how the claimed figure was reduced.

**What to remember**
1. Lifespan examples are commonly used reference points, not fixed rules.
2. Cleaning issues are different from replacement and depreciation issues.
3. Explain the deduction calculation, not just the invoice amount.`,
    sourceLabel: 'mydeposits',
    sourceHref:
      'https://www.mydeposits.co.uk/content-hub/rules-of-claiming-for-deposit-deductions/',
  },
  {
    title: 'Check In Reports — What Makes a Strong One',
    category: 'Evidence and Documentation',
    regions: ['all', 'england', 'wales', 'scotland'],
    summary:
      'What a thorough check in report should include and why it is often the most important document in a deposit dispute.',
    content: `**Practical summary**
The check in report is often the most important document in a deposit dispute because it establishes the starting condition of the property. If the opening record is vague, later deductions become much harder to prove.

**What a strong check in report includes**
- Room-by-room written condition notes.
- Dated photos.
- Inventory of contents where relevant.
- Tenant sign-off or a clear written opportunity to amend.

**Common mistakes**
- Vague descriptions such as "good condition" with no detail.
- Missing photos or no date trail.
- Failing to record pre-existing marks, wear, or damage.
- Missing opening meter readings where they matter.

**What to remember**
1. Objectivity matters more than dramatic language.
2. Detail at the start saves time at tenancy end.
3. Signed or acknowledged reports usually carry more weight.`,
    sourceLabel: 'DPS',
    sourceHref:
      'https://www.depositprotection.com/learning-centre/disputes/preparing-for-disputes-the-check-in',
  },
  {
    title: 'Check Out Reports — What to Include and How to Compare',
    category: 'Evidence and Documentation',
    regions: ['all', 'england', 'wales', 'scotland'],
    summary:
      'How to produce a check out report that directly supports a deposit claim by comparing end condition clearly against the check in record.',
    content: `**Practical summary**
The check out report should compare the end condition back to the opening record, not simply describe the property in isolation. Comparison-focused language makes it easier to explain why a deduction is being proposed and what evidence supports it.

**What to include**
- Comparison-focused room notes tied back to the check in record.
- Same-angle photos where possible.
- Specific cleaning and condition observations.
- Meter readings and timing close to the move out date.

**Common mistakes**
- Using subjective or emotional language.
- Producing a report too long after the tenancy ended.
- Taking photos that cannot easily be matched to the opening evidence.

**What to remember**
1. The goal is comparison, not commentary.
2. Specific wording carries more weight than dramatic wording.
3. Date proximity to move out helps defend the report.`,
    sourceLabel: 'DPS',
    sourceHref:
      'https://www.depositprotection.com/press-releases/2022/student-tenant-checkout-tips',
  },
  {
    title: 'Communicating Deposit Deductions to Tenants',
    category: 'Dispute Handling',
    regions: ['all', 'england', 'wales', 'scotland'],
    summary:
      'How to explain proposed deductions clearly and professionally so disputes are less likely to escalate.',
    content: `**Practical summary**
Proposed deductions should be communicated early, clearly, and in a professional tone. A structured line-item explanation linked to the evidence often reduces unnecessary escalation.

**What the message should include**
- The amount proposed for each line item.
- A short factual reason for each deduction.
- The key supporting evidence.
- The next step if the tenant agrees or disputes the proposal.

**Practical approach**
- Keep the tone factual and professional.
- Keep records of written communication.
- Give the tenant a clear opportunity to review the supporting evidence.

**Common mistakes**
- Sending a single lump sum with no breakdown.
- Using emotional language rather than evidence-linked wording.
- Failing to keep a written record of what was sent and when.

**What to remember**
1. Early, evidence-linked communication often reduces disputes.
2. Clear line items are easier to review than broad narratives.
3. Written records matter if the case later escalates.`,
    sourceLabel: 'TDS',
    sourceHref:
      'https://custodial.tenancydepositscheme.com/tools-and-guides/user-guides/all-users/deposit-deductions-template',
  },
  {
    title: 'Northern Ireland tenancy deposit protection',
    category: 'Deposit Schemes',
    regions: ['northern-ireland'],
    summary:
      'In Northern Ireland, deposits for private tenancies must be protected in an approved tenancy deposit scheme within 28 days, and the tenant must receive the required written information within 35 days.',
    content: `**Practical summary**
Northern Ireland has its own tenancy deposit protection timetable. A landlord or agent must protect the deposit in an approved scheme within 28 days of receiving it and must then give the tenant the required written information within 35 days.

**What the written information should cover**
- the protected deposit amount
- the tenancy address
- landlord and agent contact details
- the scheme administrator details and how disputes are raised
- the reasons part or all of the deposit could be withheld
- what happens if the tenant cannot be contacted at tenancy end

**Operational impact**
- Deposit protection timing should be checked before any end-of-tenancy deduction is escalated.
- The scheme record, dates, and information pack should sit in the same evidence file as the tenancy documents.
- If the protection position is unclear, fix that first before assuming the dispute file is ready.

**What to remember**
1. Northern Ireland uses a 28-day protection deadline and a 35-day information deadline.
2. Missing scheme paperwork weakens the tenancy-end file immediately.
3. Deposit compliance should be verified before the operator starts formal deduction handling.`,
    sourceLabel: 'nidirect',
    sourceHref: 'https://www.nidirect.gov.uk/articles/tenancy-deposit-scheme-information-tenants',
  },
  {
    title: 'Renting Homes (Wales) occupation contracts',
    category: 'Dispute Handling',
    regions: ['wales'],
    summary:
      'Wales now operates under the Renting Homes framework, so operators should treat occupation contracts, written statements, and notice rules as Wales-specific rather than assuming the England process applies.',
    content: `**Practical summary**
The Renting Homes (Wales) Act changed the tenancy framework in Wales. Most new arrangements are now occupation contracts, and the written statement, possession notices, and contract-holder protections should be treated as Wales-specific.

**Why this matters at tenancy end**
- The legal framework is no longer aligned neatly enough with England to keep Wales as a hidden sub-case.
- Operators should separate the deposit evidence question from the occupation contract and notice question.
- The file should include the written statement and any contract variation record where those documents affect the dispute context.

**Operational checks**
- confirm whether the agreement is an occupation contract
- make sure the written statement is available in the file
- avoid relying on England-only terminology when explaining the tenancy position

**What to remember**
1. Wales should be treated as its own top-level jurisdiction in the guidance model.
2. Occupation contract rules can materially affect how tenancy-end issues are framed.
3. Keep the deduction evidence analysis and the contract-law analysis clearly separated.`,
    sourceLabel: 'GOV.WALES',
    sourceHref: 'https://www.gov.wales/renting-homes-frequently-asked-questions-tenants',
  },
  {
    title: 'Northern Ireland deposit disputes and repayment',
    category: 'Dispute Handling',
    regions: ['northern-ireland'],
    summary:
      'Approved tenancy deposit schemes in Northern Ireland have their own dispute resolution process for disagreements over repayment at the end of the tenancy.',
    content: `**Practical summary**
If the landlord and tenant disagree about how much deposit should be returned, an approved Northern Ireland scheme can send the case into its dispute resolution mechanism. Managers should assume the file will be judged on documents, timings, and line-by-line clarity rather than narrative alone.

**What to prepare before escalating**
- a clean deduction schedule with each amount broken out
- the tenancy agreement and any scheme paperwork
- check in and check out evidence tied to the same rooms or items
- invoices, quotes, rent statements, or communication records relevant to the disputed sum

**Practical approach**
- Narrow weak items before the dispute is raised.
- Keep each claimed amount tied to one clear evidence path.
- Make sure the submission explains why the figure is proportionate and not betterment.

**What to remember**
1. Northern Ireland scheme disputes still turn heavily on document quality.
2. A concise, evidence-linked schedule is stronger than a broad narrative bundle.
3. Scheme repayment disagreements should be prepared before the case is pushed into formal dispute handling.`,
    sourceLabel: 'nidirect',
    sourceHref: 'https://www.nidirect.gov.uk/articles/sorting-out-disputes',
  },
  {
    title: 'Northern Ireland tenancy notices and possession basics',
    category: 'Dispute Handling',
    regions: ['northern-ireland'],
    summary:
      'Northern Ireland private tenancies have their own notice to quit rules, tenancy information requirements, and due-process protections, all of which matter when an end-of-tenancy dispute escalates.',
    content: `**Practical summary**
Northern Ireland private tenancies operate under a different legal framework from England, Wales, and Scotland. Notice to quit periods depend on the length of the tenancy, and landlords must follow due process of law if possession is contested.

**Operational implications**
- Tenancy Information Notices should be checked as part of the core tenancy file.
- Notice assumptions from England, Wales, or Scotland should not be applied automatically.
- If the tenancy-end position might move into possession or eviction territory, operators should separate the legal process question from the deposit evidence question.

**Notice points to keep in mind**
- landlord notice periods increase with tenancy length
- tenants also have minimum notice obligations
- due process still matters if the tenant does not leave voluntarily

**What to remember**
1. Northern Ireland notice rules are jurisdiction-specific.
2. Deposit evidence and possession process should be assessed separately.
3. Check the tenancy file for the Tenancy Information Notice and the correct notice position before escalating a contested exit.`,
    sourceLabel: 'nidirect',
    sourceHref: 'https://www.nidirect.gov.uk/articles/private-rent-and-tenancies',
  },
  {
    title: 'Northern Ireland landlord registration and problem escalation',
    category: 'Evidence and Documentation',
    regions: ['northern-ireland'],
    summary:
      'Northern Ireland private landlords must be registered, and councils can investigate certain private rented housing problems including deposit and tenancy information failures.',
    content: `**Practical summary**
Northern Ireland landlords letting private tenancies must register, and tenants can ask the council to investigate where key legal duties are not being met. For end-of-tenancy operations, this means registration and compliance checks should be treated as part of the file quality review.

**When this matters**
- the landlord registration position is unclear
- the deposit was not protected properly
- tenancy information was not given on time
- the case may need escalation beyond ordinary repayment negotiation

**Operational approach**
- Confirm the landlord identity and registration position early.
- Keep a record of scheme compliance, tenancy information, and any complaints or council contact.
- If the dispute may widen into broader housing compliance issues, note that separately from the deduction evidence schedule.

**What to remember**
1. Registration and compliance checks strengthen the operator file in Northern Ireland.
2. Local councils may become relevant where tenancy duties have not been met.
3. Treat regulatory issues as a separate track from the deduction evidence analysis.`,
    sourceLabel: 'nidirect',
    sourceHref: 'https://www.nidirect.gov.uk/articles/getting-help-problems-private-rented-housing',
  },
]

export default async function KnowledgePage() {
  await requireOperatorTenant('/knowledge')

  return <KnowledgeClient articles={GUIDANCE_ARTICLES} />
}
