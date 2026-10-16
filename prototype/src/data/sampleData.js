// Realistic sample data for AUDIXA — KSA (Saudi Arabia) audit workflow platform.
// SAR = Saudi Riyal. Fictional but plausible client/firm names, refs and figures.

export const currentUser = {
  id: 'u-1042',
  name: 'Fahad Al-Otaibi',
  role: 'Engagement Manager',
  email: 'fahad.alotaibi@analytix.sa',
  auditor: 'ABCPA',
  avatarInitials: 'FA',
}

export const auditors = [
  { code: 'ABCPA', name: 'Ashraf Bassas CPA Firm' },
  { code: 'MISCPA', name: 'Man Ibrahim Alshinqiti CPA Firm' },
]

export const teamMembers = [
  { id: 'tm-01', name: 'Fahad Al-Otaibi', role: 'Engagement Manager', auditor: 'ABCPA', email: 'fahad.alotaibi@analytix.sa', initials: 'FA', activeFiles: 6 },
  { id: 'tm-02', name: 'Sara Al-Qahtani', role: 'Senior Auditor', auditor: 'ABCPA', email: 'sara.alqahtani@analytix.sa', initials: 'SQ', activeFiles: 8 },
  { id: 'tm-03', name: 'Omar Al-Harbi', role: 'Audit Associate', auditor: 'ABCPA', email: 'omar.alharbi@analytix.sa', initials: 'OH', activeFiles: 5 },
  { id: 'tm-04', name: 'Lina Al-Mutairi', role: 'Audit Associate', auditor: 'MISCPA', email: 'lina.almutairi@analytix.sa', initials: 'LM', activeFiles: 4 },
  { id: 'tm-05', name: 'Yousef Al-Dosari', role: 'Senior Auditor', auditor: 'MISCPA', email: 'yousef.aldosari@analytix.sa', initials: 'YD', activeFiles: 7 },
  { id: 'tm-06', name: 'Noura Al-Zahrani', role: 'Quality Reviewer', auditor: 'ABCPA', email: 'noura.alzahrani@analytix.sa', initials: 'NZ', activeFiles: 3 },
  { id: 'tm-07', name: 'Khalid Al-Ghamdi', role: 'Front Office Coordinator', auditor: 'ABCPA', email: 'khalid.alghamdi@analytix.sa', initials: 'KG', activeFiles: 0 },
  { id: 'tm-08', name: 'Rania Al-Shehri', role: 'Practice Manager', auditor: 'MISCPA', email: 'rania.alshehri@analytix.sa', initials: 'RS', activeFiles: 0 },
]

// ── Engagement team & Front Officer registries ──────────────────────────────
// Referenced by `lead` / `fo` on each client row below (id lookup pattern
// adapted from the teammate's Audit360 console: `team` / `fos` + `byId()`).
export const engTeam = [
  { id: 'RP', name: 'Rijin Philip', role: 'Audit Lead', color: '#e0a83c' },
  { id: 'PJ', name: 'Pavithra Joy', role: 'Audit Associate', color: '#5b9bd5' },
  { id: 'JF', name: 'Jefin Jose', role: 'Audit Associate', color: '#35c08a' },
  { id: 'AM', name: 'Ansa Davis', role: 'Team Lead', color: '#e5484d' },
  { id: 'DS', name: 'Deepak Suresh', role: 'Auditor', color: '#b98bff' },
]
export const byId = (id) => engTeam.find((t) => t.id === id) || { id, name: id, color: '#8b99b6' }

export const engFrontOfficers = [
  { id: 'FY', name: 'Fayis', role: 'Front Officer', phone: '+966 55 018 4422', email: 'fayis@analytix.sa', color: '#2563EB' },
  { id: 'UV', name: 'Uvais', role: 'Front Officer', phone: '+966 55 271 9008', email: 'uvais@analytix.sa', color: '#0F766E' },
  { id: 'MA', name: 'M Ali', role: 'Front Officer', phone: '+966 56 334 7781', email: 'm.ali@analytix.sa', color: '#D97706' },
  { id: 'AZ', name: 'Azhar', role: 'Front Officer', phone: '+966 54 662 1150', email: 'azhar@analytix.sa', color: '#7C3AED' },
  { id: 'AL', name: 'Allen', role: 'Front Officer (Senior)', phone: '+966 50 889 3277', email: 'allen@analytix.sa', color: '#DC2626' },
]
// Primary client / engagement portfolio data source (replaces prior placeholder
// `clients` array). Field shape kept as in the source console: code/id/name/
// sector/fy/turnover/phase/progress/status/exceptions/city/lead/profile/fo/
// contact.../due/zakat/audit — `lead` and `fo` are ids into engTeam / engFrontOfficers.
export const clients = [
  { code: 'ZK-001', id: 'AR', name: 'Al-Rowad Trading Co.', sector: 'Trading', fy: 'FY2025', turnover: 'SAR 42.0M', phase: 5, progress: 58, status: 'crit', exceptions: 3, city: 'Riyadh', lead: 'RP', profile: 'ABCA', fo: 'FY', contact: 'Khalid Al-Rowad', cphone: '+966 11 462 7788', cemail: 'finance@alrowad.sa', due: '2026-09-20', zakat: true, audit: 'Proper' },
  { code: 'ZK-002', id: 'NM', name: 'Najd Manufacturing Ltd.', sector: 'Manufacturing', fy: 'FY2025', turnover: 'SAR 96.4M', phase: 3, progress: 34, status: 'warn', exceptions: 1, city: 'Dammam', lead: 'DS', profile: 'MIS', fo: 'UV', contact: 'Sara Al-Najdi', cphone: '+966 13 331 4020', cemail: 'accounts@najdmfg.sa', due: '2026-10-15', zakat: true, audit: 'Proper' },
  { code: 'ZK-003', id: 'GC', name: 'Gulf Contracting Est.', sector: 'Contracting', fy: 'FY2025', turnover: 'SAR 61.8M', phase: 7, progress: 82, status: 'ok', exceptions: 0, city: 'Jeddah', lead: 'AM', profile: 'ABCA', fo: 'MA', contact: 'Omar Gulf', cphone: '+966 12 664 9911', cemail: 'cfo@gulfcontracting.sa', due: '2026-09-30', zakat: false, audit: 'Disclaimer' },
  { code: 'ZK-004', id: 'SS', name: 'Salam Services WLL', sector: 'Services', fy: 'FY2025', turnover: 'SAR 12.3M', phase: 2, progress: 18, status: 'warn', exceptions: 2, city: 'Riyadh', lead: 'AM', profile: 'MIS', fo: 'AZ', contact: 'Nada Salam', cphone: '+966 11 208 5567', cemail: 'admin@salamservices.sa', due: '2026-11-30', zakat: false, audit: 'Disclaimer' },
  { code: 'ZK-005', id: 'TF', name: 'Tabuk Foods Co.', sector: 'Manufacturing / FMCG', fy: 'FY2025', turnover: 'SAR 78.9M', phase: 8, progress: 94, status: 'ok', exceptions: 0, city: 'Tabuk', lead: 'DS', profile: 'MIS', fo: 'AL', contact: 'Faisal Tabuk', cphone: '+966 14 422 3390', cemail: 'finance@tabukfoods.sa', due: '2026-09-12', zakat: true, audit: 'Proper' },
  { code: 'ZK-006', id: 'HL', name: 'Hijaz Logistics WLL', sector: 'Services / Logistics', fy: 'FY2025', turnover: 'SAR 33.5M', phase: 4, progress: 46, status: 'warn', exceptions: 1, city: 'Jeddah', lead: 'RP', profile: 'ABCA', fo: 'FY', contact: 'Yousef Hijaz', cphone: '+966 12 770 1123', cemail: 'ap@hijazlogistics.sa', due: '2026-10-31', zakat: true, audit: 'Proper' },
]

const TODAY_DEMO = new Date('2026-09-16T00:00:00')
// Days remaining until a client's due date — negative means overdue.
export function dueDays(c) {
  if (!c.due) return 9999
  return Math.round((new Date(c.due + 'T00:00:00') - TODAY_DEMO) / 86400000)
}
// Due-date chip {text, tone} — mirrors the console's dueChip() thresholds.
export function dueChip(c) {
  const d = dueDays(c)
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, tone: 'alert-red' }
  if (d === 0) return { text: 'Due today', tone: 'alert-red' }
  if (d <= 7) return { text: `In ${d}d`, tone: 'amber' }
  if (d <= 30) return { text: `In ${d}d`, tone: 'blue' }
  return { text: new Date(c.due + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), tone: 'grey' }
}

// Notifications feed used by Header bell / notification center.
export const notifications = [
  { id: 'n1', type: 'query', title: 'New reply on Q-1141-01', description: 'Abdullah Al-Rashid replied on Nakheel Al-Riyadh inventory query.', timestamp: '2026-02-03 11:40', read: false },
  { id: 'n2', type: 'status', title: 'AF-2026-0207 moved to Under Review', description: 'Dammam Steel Fabrication file submitted for quality review.', timestamp: '2026-02-01 17:05', read: false },
  { id: 'n3', type: 'deadline', title: 'Due date approaching — AF-2026-0142', description: 'Jeddah Coastal Logistics file due in 3 days.', timestamp: '2026-02-25 08:00', read: false },
  { id: 'n4', type: 'assignment', title: 'You were assigned AF-2026-0208', description: 'Al Madinah Healthcare Holding assigned to Lina Al-Mutairi.', timestamp: '2026-02-01 09:12', read: true },
  { id: 'n5', type: 'status', title: 'AF-2026-0210 rejected', description: 'Al Ahsa Date Processing liquidation file rejected — see review notes.', timestamp: '2026-01-31 16:44', read: true },
]
// ── Client Portal (Module 2) — Kingdom Retail Holdings LLC ──────────────────

export const clientPortal = {
  clientName: 'Kingdom Retail Holdings LLC',
  role: 'Authorised Signatory',
  // Demo role switch: 'Authorised Signatory' | 'Standard User'. Drives what
  // signatory-only controls are rendered across the client portal — see
  // Additions 2 & 3. Default is Authorised Signatory per the module brief.
  clientRole: 'Authorised Signatory',
  fiscalYear: 'FY2024',
  engagementRef: 'KSA-2024-8841',
  statutoryDeadline: '15 Nov 2024',
  daysRemaining: 38,
  stages: [
    { id: 'onboarding', label: 'Onboarding', status: 'completed' },
    { id: 'data-collection', label: 'Data Collection', status: 'completed' },
    { id: 'under-audit', label: 'Under Audit', status: 'active' },
    { id: 'draft-issued', label: 'Draft Issued', status: 'upcoming' },
    { id: 'finalized', label: 'Finalized', status: 'upcoming' },
    // qawaemRef only ever renders once this stage's status is 'completed' —
    // see Addition 4 on the dashboard's stage stepper.
    { id: 'filed', label: 'Filed', status: 'upcoming', qawaemRef: 'QAW-2024-88412' },
  ],
  onHold: {
    active: true,
    reason: 'documents', // 'documents' | 'payment' | 'no-response'
    message: 'On Hold — Awaiting Documents: ZATCA VAT Return Q3, Bank Statement October 2024.',
    items: ['ZATCA VAT Return Q3', 'Bank Statement October 2024'],
    // For reason='payment': paymentAmount, dueDate
  },
  stats: {
    totalRequirements: 84,
    documentsAccepted: 62,
    pendingAction: 14,
    pendingDueThisWeek: 4,
    openQueries: 8,
    criticalQueries: 2,
  },
  recentSubmissions: [
    {
      id: 'sub-1',
      name: 'Trade License Renewal 2024',
      status: 'Accepted',
      fileName: 'trade_license_2024.pdf',
      timestamp: '08 Oct 2024, 14:20',
      reviewer: 'K. Al-Otaibi',
    },
    {
      id: 'sub-2',
      name: 'Top 10 Customer Contracts',
      status: 'Under Review',
      fileName: 'contracts_top10_signed.pdf',
      timestamp: '09 Oct 2024, 10:14',
      reviewer: 'S. Crawford',
    },
    {
      id: 'sub-3',
      name: 'Q3 Bank Reconciliation',
      status: 'Action Required',
      fileName: '—',
      timestamp: '—',
      reviewer: 'Pending Upload',
      actionRequired: true,
    },
    {
      id: 'sub-4',
      name: 'Fixed Asset Register',
      status: 'Accepted',
      fileName: 'fa_register_fy24.xlsx',
      timestamp: '05 Oct 2024, 09:02',
      reviewer: 'T. Al-Harbi',
    },
    {
      id: 'sub-5',
      name: 'ECL Provision Calculation',
      status: 'Rejected',
      fileName: 'ecl_provision_calc_v1.xlsx',
      timestamp: '03 Oct 2024, 16:41',
      reviewer: 'T. Al-Ghamdi',
    },
  ],
  engagementTeam: [
    { name: 'Tariq Al-Harbi', role: 'Lead Audit Partner', initials: 'TA', online: true },
    { name: 'Sarah Crawford', role: 'Technical Audit Senior', initials: 'SC', online: true },
    { name: 'Fahad Al-Otaibi', role: 'ZATCA Tax Specialist', initials: 'FA', online: false },
  ],
  engagementThread: [
    { author: 'Tariq Al-Harbi', timestamp: '10:42 AM', text: 'Please share the October bank statement when ready.' },
    { author: 'You', timestamp: '11:15 AM', text: 'Will upload by end of day, thank you.' },
  ],
}

// Client portal notifications feed — powers the header bell dropdown
// (ClientLayout). `icon` is a lucide-react component name resolved by the
// panel component; `unread` items get the light red tint until "Mark All
// as Read" is clicked.
export const clientNotifications = [
  {
    id: 'cn-1',
    section: 'action',
    icon: 'Bell',
    title: 'Document Rejected — Re-upload Required',
    message: 'Your Allowance for Expected Credit Losses document was rejected. Please re-upload the corrected version.',
    chip: 'REV-03',
    timestamp: '2 mins ago',
    action: { label: 'Re-upload Now', route: '/client/requirements' },
    unread: true,
  },
  {
    id: 'cn-2',
    section: 'action',
    icon: 'Clock',
    title: 'New Requirement Added',
    message: 'The audit team has added 2 new requirements to your file. Please review and upload.',
    chip: null,
    timestamp: '2 hours ago',
    action: { label: 'View Requirements', route: '/client/requirements' },
    unread: true,
  },
  {
    id: 'cn-3',
    section: 'action',
    icon: 'FileText',
    title: 'Query Raised by Audit Team',
    message: 'A new query has been raised regarding Q3 revenue entries. Please review and respond.',
    chip: 'QRY-01',
    timestamp: '3 hours ago',
    action: { label: 'View Query', route: '/client/queries' },
    unread: true,
  },
  {
    id: 'cn-4',
    section: 'status',
    icon: 'CheckCircle2',
    title: 'Document Accepted',
    message: 'Your Fixed Assets Register FY24 has been accepted by the audit team.',
    chip: null,
    timestamp: 'Yesterday',
    action: null,
    unread: false,
  },
  {
    id: 'cn-5',
    section: 'status',
    icon: 'Info',
    title: 'Stage Update',
    message: 'Your engagement has advanced to Stage 3: Under Audit.',
    chip: null,
    timestamp: '2 days ago',
    action: null,
    unread: false,
  },
]
export const clientQueries = [
  {
    id: 'QRY-01',
    subject: 'Revenue Q3 Drop — Unbilled SAR 450,000 Entry Sept 29',
    status: 'Open',
    date: '05 Oct',
    linkedRef: 'REV-02',
  },
  {
    id: 'QRY-02',
    subject: 'Bank Account Signatory Confirmation — SNB Al-Rajhi SAB',
    status: 'Answered',
    date: '02 Oct',
    linkedRef: null,
  },
  {
    id: 'QRY-03',
    subject: 'Fixed Asset Disposal Documentation',
    status: 'Closed',
    date: '25 Sep',
    linkedRef: null,
  },
]
export const deliverables = {
  banner: { qawaemRef: 'QAW-2024-88412', filedDate: '22 Oct 2024' },
  cards: [
    {
      id: 'dl-1',
      title: 'Final Signed Audited Financial Statements — FY2024',
      type: 'document',
      meta: 'Issued 20 Oct 2024 · 3.2MB',
      action: 'Download PDF',
      style: 'red',
    },
    {
      id: 'dl-2',
      title: 'Qawaem Filing Confirmation',
      type: 'filing',
      meta: 'Reference QAW-2024-88412 · Filed 22 Oct 2024',
      action: 'Download Confirmation',
      style: 'red',
    },
    {
      id: 'dl-3',
      title: 'Signed Engagement Letter',
      type: 'document',
      meta: 'Signed 01 Aug 2024',
      action: 'Download',
      style: 'outline',
    },
  ],
  summary: {
    financialYear: 'FY2024',
    auditType: 'Proper Audit',
    auditor: 'ABCPA',
    personInCharge: 'Tariq Al-Harbi',
    status: 'Closed',
    completionDate: '22 Oct 2024',
  },
}

// ── Engagement lifecycle (8-stage model) ────────────────────────────────────
// Ported from the Audit360 console's LIFECYCLE array + engDone()/lifecycleBar()
// logic. Each stage's "done" state is derived from the engagement state object
// below (engagementStateTemplate / `eng`), not hardcoded — that's the pattern:
// a pure `isStageDone(state, stageId)` function drives done/current/upcoming,
// so any stepper UI (AUDIXA's LifecycleStepper) can reuse it.
export const ENGAGEMENT_LIFECYCLE = [
  { id: 'lead', label: 'Lead' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'basicdocs', label: 'Documents' },
  { id: 'el', label: 'Eng. Letter' },
  { id: 'payment', label: 'Payment' },
  { id: 'activate', label: 'Activation' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'exec', label: 'Execution' },
]

// Template shape for per-engagement lifecycle state (ported from `eng`).
// A real engagement record is this shape; `isStageDone` reads off it.
export const engagementStateTemplate = {
  code: 'ZK-001',
  client: 'Al-Rowad Trading Co.',
  fy: 'FY2026',
  framework: 'IFRS (as endorsed in KSA)',
  lead: { assessed: true, score: 86 },
  proposal: { drafted: true, approved: true, sent: true, accepted: true },
  basicDocsReceived: 8, // of 10 — basicdocs stage needs >= 7
  el: { generated: true, approved: true, sent: true, signed: true },
  pay: { issued: true, paid: true, activated: true },
  alloc: { accepted: true },
}

// Pure status-derivation function — same shape as the console's engDone(),
// generalised to take a state object instead of reading a single global.
export function isStageDone(state, stageId) {
  switch (stageId) {
    case 'lead':
      return !!state.lead?.assessed
    case 'proposal':
      return !!state.proposal?.accepted
    case 'basicdocs':
      return (state.basicDocsReceived || 0) >= 7
    case 'el':
      return !!state.el?.signed
    case 'payment':
      return !!state.pay?.paid
    case 'activate':
      return !!state.pay?.activated
    case 'allocation':
    case 'exec':
      return !!state.alloc?.accepted
    default:
      return false
  }
}

// Returns each lifecycle stage tagged with 'completed' | 'active' | 'upcoming',
// mirroring lifecycleBar()'s done/cur classes — the first not-done stage is
// 'active', everything after it is 'upcoming'.
export function getLifecycleStages(state, stages = ENGAGEMENT_LIFECYCLE) {
  let activeAssigned = false
  return stages.map((stage) => {
    const done = isStageDone(state, stage.id)
    let status = 'upcoming'
    if (done) status = 'completed'
    else if (!activeAssigned) {
      status = 'active'
      activeAssigned = true
    }
    return { ...stage, status }
  })
}

// ── Role registry — single source of truth for role-switching ──────────────
// Ported from the console's `roles` keyed-object + `role` state pattern: one
// object maps every role id to its label/description/entry route, so the
// Demo Role switcher (and, later, any role-aware nav) reads from one place
// instead of a hardcoded list.
export const ROLES = {
  client: {
    id: 'client',
    label: 'Client Login',
    name: clientPortal.clientName,
    who: 'Client portal — engagement tracker, requirements & audit queries',
    route: '/client/dashboard',
  },
  'execution-team': {
    id: 'execution-team',
    label: 'Execution Team',
    name: 'Rijin Philip · Audit Lead',
    who: 'Engagement file — requirements, fieldwork, testing & deliverables',
    route: '/team/dashboard',
  },
  'audit-management': {
    id: 'audit-management',
    label: 'Audit Management',
    name: 'Ansa Davis · Audit Manager',
    who: 'Portfolio oversight, team workload, escalations & review',
    route: '/manager/dashboard',
  },
  'sales-fe': {
    id: 'sales-fe',
    label: 'Sales & FE Operations',
    name: 'Layla Al-Khatib · Front Office',
    who: 'Client intake, lead pipeline, proposals & front-office coordination',
    route: '/fo/dashboard',
  },
  managerial: {
    id: 'managerial',
    label: 'Managerial',
    name: 'Mohammed Al-Rashid · Partner',
    who: 'Firm-wide portfolio, analytics, quality control & partner reporting',
    route: '/management/dashboard',
  },
}
export const ROLE_ORDER = ['client', 'execution-team', 'audit-management', 'sales-fe', 'managerial']

// ── Module 3 — Audit Team Portal ────────────────────────────────────────────
// Logged-in user throughout Module 3.
export const teamUser = {
  name: 'Fahad Al-Otaibi',
  role: 'Audit Lead',
  department: 'ABCPA',
  initials: 'FA',
}

// The 6 engagement files on Fahad's portfolio — same data reused across the
// dashboard, files grid, workspace header, per-client dashboard, meetings,
// chat and audit trail so every screen stays consistent.
export const teamFiles = [
  {
    code: 'ENG-2024-8841',
    slug: 'al-marai',
    client: 'Al-Marai Logistics JSC',
    auditor: 'ABCPA',
    auditType: 'Proper',
    location: 'Riyadh Hub',
    stage: 'Stage 3: Substantive Testing',
    stageColor: 'amber',
    shortAttention: '4 docs urgent',
    attention: '4 docs require immediate review',
    attentionLevel: 'URGENT',
    pbcDone: 78,
    pbcTotal: 84,
    daysOpen: 14,
    statutoryDue: '12 Nov 2024',
    lead: 'Fahad Al-Otaibi',
    associate: 'Khalid Bin-Salman',
    urgent: true,
  },
  {
    code: 'ENG-2024-9104',
    slug: 'national-medical',
    client: 'National Medical Care Co.',
    auditor: 'MISCPA',
    auditType: 'Disclaimer',
    location: 'ECL Alert',
    stage: 'Stage 3: Under Audit',
    stageColor: 'navy',
    shortAttention: '2 ECL discrepancies',
    attention: '2 critical ECL discrepancies',
    attentionLevel: 'URGENT',
    pbcDone: 92,
    pbcTotal: 96,
    daysOpen: 22,
    statutoryDue: '04 Nov 2024',
    lead: 'Fahad Al-Otaibi',
    associate: 'Khalid Bin-Salman',
    urgent: true,
  },
  {
    code: 'ENG-2024-7732',
    slug: 'riyadh-fintech',
    client: 'Riyadh Fintech Group',
    auditor: 'ABCPA',
    auditType: 'Proper',
    location: 'SAMA Vault',
    stage: 'Stage 2: PBC Collection',
    stageColor: 'amber',
    shortAttention: 'Awaiting ZATCA schema',
    attention: 'Awaiting ZATCA XML schema',
    attentionLevel: 'PENDING',
    pbcDone: 41,
    pbcTotal: 55,
    daysOpen: 9,
    statutoryDue: '28 Nov 2024',
    lead: 'Fahad Al-Otaibi',
    associate: 'Khalid Bin-Salman',
    urgent: false,
  },
  {
    code: 'ENG-2024-6590',
    slug: 'arabian-cloud',
    client: 'Arabian Cloud Computing',
    auditor: 'MISCPA',
    auditType: 'Proper',
    location: 'IFRS 15',
    stage: 'Stage 4: Quality Review',
    stageColor: 'emerald',
    shortAttention: 'Ready for sign-off',
    attention: 'Ready for Partner Sign-off',
    attentionLevel: 'FINAL',
    pbcDone: 112,
    pbcTotal: 112,
    daysOpen: 31,
    statutoryDue: '15 Nov 2024',
    lead: 'Fahad Al-Otaibi',
    associate: 'Khalid Bin-Salman',
    urgent: false,
  },
  {
    code: 'ENG-2024-5119',
    slug: 'jeddah-hospitality',
    client: 'Jeddah Hospitality Holdings',
    auditor: 'ABCPA',
    auditType: 'Proper',
    location: 'VAT Audited',
    stage: 'Stage 3: Substantive Testing',
    stageColor: 'amber',
    shortAttention: '1 sample rec left',
    attention: '1 Sample reconciliation left',
    attentionLevel: 'REVIEW',
    pbcDone: 63,
    pbcTotal: 64,
    daysOpen: 18,
    statutoryDue: '01 Dec 2024',
    lead: 'Fahad Al-Otaibi',
    associate: 'Khalid Bin-Salman',
    urgent: false,
  },
  {
    code: 'ENG-2024-4902',
    slug: 'eastern-petrochemical',
    client: 'Eastern Petrochemical Supplies',
    auditor: 'MISCPA',
    auditType: 'Proper',
    location: 'Jubail Entity',
    stage: 'Stage 4: Quality Review',
    stageColor: 'emerald',
    shortAttention: 'Inventory ledger signed',
    attention: 'Inventory valuation ledger signed',
    attentionLevel: 'OK',
    pbcDone: 140,
    pbcTotal: 142,
    daysOpen: 27,
    statutoryDue: '08 Dec 2024',
    lead: 'Fahad Al-Otaibi',
    associate: 'Khalid Bin-Salman',
    urgent: false,
  },
]
export const getTeamFile = (slug) => teamFiles.find((f) => f.slug === slug) || teamFiles[0]

export const teamPortfolioStats = {
  totalActive: 28,
  urgent: 6,
  onTrack: 14,
  withReviewer: 5,
  parked: 3,
  avgTurnaround: '2.8 days',
  pendingActionsToday: 14,
  totalOpenExceptions: 14,
}

export const teamActionCards = [
  { id: 'review', tone: 'alert-red', title: '12 Documents Awaiting Review', icon: 'FileText', action: 'Review Now', route: '/team/workspace/requirements' },
  { id: 'queries', tone: 'amber', title: '5 Open Queries — Client Replies Received', icon: 'MessageCircle', action: 'View Queries', route: '/team/workspace/queries' },
  {
    id: 'ai-flags',
    tone: 'alert-red',
    title: '3 AI Verification Flags — Awaiting Your Approval',
    icon: 'ShieldAlert',
    note: 'AI has flagged these items. Your approval is required before anything is sent to the client.',
    action: 'Review Flags',
    route: '/team/workspace/requirements',
  },
  { id: 'deadlines', tone: 'amber', title: '2 Files Approaching Deadline', icon: 'Clock', action: 'View Files', route: '/team/files' },
]

export const teamTasks = [
  {
    id: 't1',
    priority: 'URGENT',
    description: 'Review 3 rejected documents on Al-Marai Logistics — bank statements pending re-verification',
    client: 'Al-Marai Logistics JSC',
    deadline: 'Today',
    fileSlug: 'al-marai',
  },
  {
    id: 't2',
    priority: 'URGENT',
    description: 'Clear self-review on Ranco Projects before statutory deadline',
    client: 'Ranco Projects',
    deadline: 'Today 5:00 PM',
    fileSlug: 'al-marai',
  },
  {
    id: 't3',
    priority: 'URGENT',
    description: 'Reply to open query REV-03 — ECL matrix clarification awaited from client',
    client: 'Al-Rajhi Capital',
    deadline: 'Today',
    fileSlug: 'al-marai',
  },
  {
    id: 't4',
    priority: 'HIGH',
    description: 'Review 5 uploaded documents on Eastern Petrochemical — inventory valuation pack',
    client: 'Eastern Petrochemical Supplies',
    deadline: 'Tomorrow',
    fileSlug: 'eastern-petrochemical',
  },
  {
    id: 't5',
    priority: 'HIGH',
    description: 'Raise query on GOSI variance — Sept payroll register discrepancy SAR 18,400',
    client: 'Jeddah Hospitality Holdings',
    deadline: 'Tomorrow',
    fileSlug: 'jeddah-hospitality',
  },
  {
    id: 't6',
    priority: 'HIGH',
    description: 'Complete analytical procedures — Riyadh Fintech Group TB analysis pending',
    client: 'Riyadh Fintech Group',
    deadline: '10 Nov 2024',
    fileSlug: 'riyadh-fintech',
  },
  {
    id: 't7',
    priority: 'NORMAL',
    description: 'Download and archive Qawaem filing confirmation for Arabian Cloud Computing',
    client: 'Arabian Cloud Computing',
    deadline: 'This week',
    fileSlug: 'arabian-cloud',
  },
  {
    id: 't8',
    priority: 'NORMAL',
    description: 'Update prepaid amortization schedule — National Medical Care Co.',
    client: 'National Medical Care Co.',
    deadline: '12 Nov 2024',
    fileSlug: 'national-medical',
  },
  {
    id: 't9',
    priority: 'NORMAL',
    description: 'Schedule client meeting — Jeddah Hospitality year-end discussion',
    client: 'Jeddah Hospitality Holdings',
    deadline: 'This week',
    fileSlug: 'jeddah-hospitality',
  },
]

export const teamRecentActivity = [
  { id: 'a1', client: 'Al-Marai Logistics JSC', event: 'Client re-uploaded ECL Model Matrix — awaiting your review', timestamp: '12 mins ago' },
  { id: 'a2', client: 'Riyadh Fintech Group', event: 'New requirement REV-06 added to PBC list', timestamp: '48 mins ago' },
  { id: 'a3', client: 'Arabian Cloud Computing', event: 'Stage advanced to Quality Review', timestamp: '2 hours ago' },
  { id: 'a4', client: 'Jeddah Hospitality Holdings', event: 'Query QRY-04 answered by client', timestamp: '3 hours ago' },
  { id: 'a5', client: 'Eastern Petrochemical Supplies', event: '5 documents uploaded to requirements', timestamp: 'Yesterday' },
]

// ── File Workspace — Queries tab ────────────────────────────────────────────
export const teamQueries = [
  { id: 'QRY-01', subject: 'Revenue Q3 Drop — Unbilled SAR 450,000 Entry Sept 29', status: 'Open', date: '05 Oct', linkedRef: 'REV-02' },
  { id: 'QRY-02', subject: 'Bank Account Signatory Confirmation', status: 'Answered', date: '02 Oct', linkedRef: null },
  { id: 'QRY-03', subject: 'Fixed Asset Disposal Documentation', status: 'Closed', date: '25 Sep', linkedRef: null },
  { id: 'QRY-04', subject: 'GOSI Contribution Variance — Sept Payroll', status: 'Open', date: '01 Oct', linkedRef: null },
]
// ── File Workspace — Procedures tab ─────────────────────────────────────────
export const teamProcedures = [
  { id: 'P-01', name: 'Opening Balance Verification', description: 'Verify prior year closing balances agree to current year opening entries', status: 'Not Started', action: 'Begin' },
  { id: 'P-02', name: 'Trial Balance Analysis', description: 'Initial TB scrutiny, structure check, mapping to chart of accounts, prior year comparison', status: 'In Progress', action: 'Continue' },
  { id: 'P-03', name: 'Analytical Procedures (TB + GL Dump)', description: 'Revenue, expense and balance sheet analytics using TB and general ledger', status: 'Not Started', action: 'Begin' },
  { id: 'P-04', name: 'Substantive Testing', description: 'Sample-based vouching per selection criteria. Formulas configured at build time.', status: 'In Progress', action: 'Continue' },
  { id: 'P-05', name: 'Schedule Building', description: 'Prepaid amortization, salary schedules, depreciation, standard formats. Configured at build time.', status: 'Not Started', action: 'Begin' },
  { id: 'P-06', name: 'Financial Statement Export', description: 'TB and FS in exportable format. ABCPA and MISCPA formats differ — configured at build time.', status: 'Not Started', action: 'Begin' },
]

// ── File Workspace — Deliverables tab ───────────────────────────────────────
export const teamDeliverables = {
  draftAfs: { status: 'In Preparation', note: 'Substantive testing 78% complete — Draft FS available after Stage 4 completion.', issuedDate: null, clientConfirmation: null, commentsReceived: 0 },
  finalAfs: { status: 'Pending', finalIssueDate: null, signedByAuditor: null },
  qawaem: {
    status: 'Pending',
    checklist: [
      'CR details verified',
      'Financial year confirmed',
      'Figures agree to signed AFS',
      'Arabic FS included where applicable',
      'Signatures confirmed',
    ],
    submissionReference: null,
    filingConfirmation: null,
    filingDate: null,
  },
  timeline: [
    { id: 'draft-prepared', label: 'Draft Prepared', status: 'active' },
    { id: 'draft-issued', label: 'Draft Issued to Client', status: 'upcoming' },
    { id: 'client-confirmation', label: 'Client Confirmation', status: 'upcoming' },
    { id: 'final-issued', label: 'Final AFS Issued', status: 'upcoming' },
    { id: 'qawaem-uploaded', label: 'Qawaem Uploaded', status: 'upcoming' },
    { id: 'filing-confirmed', label: 'Filing Confirmed', status: 'upcoming' },
  ],
}

// ── File Workspace — Audit Trail tab ────────────────────────────────────────
export const teamAuditTrail = [
  { id: 'ev1', type: 'ai', title: 'AI Flag Raised', description: 'Rejection drafted for ECL Model Matrix — awaiting Lead approval', user: 'AI Engine', client: 'Al-Marai Logistics JSC', timestamp: '05 Nov 2024, 09:02' },
  { id: 'ev2', type: 'document', title: 'Document Uploaded', description: 'ecl_provision_calc_v1.xlsx re-uploaded by client', user: 'Client', client: 'Al-Marai Logistics JSC', timestamp: '05 Nov 2024, 08:47' },
  { id: 'ev3', type: 'query', title: 'Query Raised', description: 'QRY-04 raised regarding GOSI contribution variance', user: 'Fahad Al-Otaibi', client: 'Al-Marai Logistics JSC', timestamp: '04 Nov 2024, 16:20' },
  { id: 'ev4', type: 'accept', title: 'Document Accepted', description: 'Audited Revenue Ledger accepted after review', user: 'Khalid Bin-Salman', client: 'Al-Marai Logistics JSC', timestamp: '03 Nov 2024, 14:10' },
  { id: 'ev5', type: 'query', title: 'Query Answered', description: 'Client responded to QRY-01 Revenue Q3 Drop query', user: 'Client', client: 'Al-Marai Logistics JSC', timestamp: '03 Nov 2024, 11:15' },
  { id: 'ev6', type: 'reject', title: 'Document Rejected', description: 'ECL Model Matrix rejected — missing default rate calc', user: 'Fahad Al-Otaibi', client: 'Al-Marai Logistics JSC', timestamp: '02 Nov 2024, 17:42' },
  { id: 'ev7', type: 'stage', title: 'Stage Changed', description: 'Engagement advanced to Stage 3: Substantive Testing', user: 'Fahad Al-Otaibi', client: 'Al-Marai Logistics JSC', timestamp: '01 Nov 2024, 09:00' },
  { id: 'ev8', type: 'meeting', title: 'Meeting Scheduled', description: 'Q3 Revenue Cutoff Discussion scheduled for 08 Nov', user: 'Fahad Al-Otaibi', client: 'Al-Marai Logistics JSC', timestamp: '31 Oct 2024, 15:30' },
  { id: 'ev9', type: 'document', title: 'Document Uploaded', description: 'contracts_top10_signed.pdf uploaded by client', user: 'Client', client: 'Al-Marai Logistics JSC', timestamp: '30 Oct 2024, 10:14' },
  { id: 'ev10', type: 'query', title: 'Query Raised', description: 'QRY-02 raised regarding bank signatory confirmation', user: 'Khalid Bin-Salman', client: 'Al-Marai Logistics JSC', timestamp: '28 Oct 2024, 13:05' },
  { id: 'ev11', type: 'stage', title: 'File Allocated', description: 'Engagement allocated to Fahad Al-Otaibi (Lead) and Khalid Bin-Salman (Associate)', user: 'Ansa Davis', client: 'Al-Marai Logistics JSC', timestamp: '15 Oct 2024, 09:00' },
  { id: 'ev12', type: 'stage', title: 'Engagement Created', description: 'ENG-2024-8841 created for FY2024 statutory audit', user: 'Ansa Davis', client: 'Al-Marai Logistics JSC', timestamp: '10 Oct 2024, 11:30' },
]

// ── Notifications Center ────────────────────────────────────────────────────
export const teamNotifications = [
  {
    id: 'tn1',
    icon: 'ShieldAlert',
    title: 'AI Verification Flag — Approval Required',
    message: 'Bank statement ends 29 Dec on Al-Marai file. Rejection drafted — awaiting your approval before sending to client.',
    client: 'Al-Marai Logistics JSC',
    timestamp: '2 mins ago',
    action: { label: 'Review Flag', route: '/team/workspace/requirements', tone: 'red' },
    unread: true,
  },
  {
    id: 'tn2',
    icon: 'FileText',
    title: 'Document Rejected — Re-upload Received',
    message: 'Client re-uploaded ECL matrix on Al-Marai file. Requires your review.',
    client: 'Al-Marai Logistics JSC',
    timestamp: '15 mins ago',
    action: { label: 'Review Doc', route: '/team/workspace/requirements', tone: 'red' },
    unread: true,
  },
  {
    id: 'tn3',
    icon: 'Clock',
    title: 'Deadline Alert — 3 Days Remaining',
    message: 'Al-Rajhi Heavy Industries statutory deadline is 12 Nov 2024. File is at Stage 3.',
    client: 'Al-Rajhi Heavy',
    timestamp: '1 hour ago',
    action: { label: 'Open File', route: '/team/files', tone: 'red' },
    unread: true,
  },
  {
    id: 'tn4',
    icon: 'MessageCircle',
    title: 'New Query Reply — Action Needed',
    message: 'Client replied to QRY-01 Revenue Q3 Drop query. Thread needs your review and closure.',
    client: 'Al-Marai Logistics JSC',
    timestamp: '2 hours ago',
    action: { label: 'View Query', route: '/team/workspace/queries', tone: 'red' },
    unread: true,
  },
  {
    id: 'tn5',
    icon: 'Plus',
    title: 'New Requirement Added',
    message: 'Manager added 2 new requirement lines to Riyadh Fintech Group file. Client notified.',
    client: 'Riyadh Fintech Group',
    timestamp: '3 hours ago',
    action: { label: 'View Requirements', route: '/team/workspace/requirements', tone: 'amber' },
    unread: true,
  },
  {
    id: 'tn6',
    icon: 'FileText',
    title: 'Draft FS Ready for Issuance',
    message: 'Arabian Cloud Computing file has cleared all procedures. Draft FS can now be issued to client.',
    client: 'Arabian Cloud Computing',
    timestamp: '5 hours ago',
    action: { label: 'Issue Draft', route: '/team/workspace/deliverables', tone: 'amber' },
    unread: true,
  },
  {
    id: 'tn7',
    icon: 'Calendar',
    title: 'Client Meeting Requested',
    message: 'Kingdom Retail Holdings LLC has requested a meeting. Please confirm a time slot.',
    client: 'Kingdom Retail Holdings',
    timestamp: 'Yesterday',
    action: { label: 'Schedule Meeting', route: '/team/schedule-meeting', tone: 'amber' },
    unread: true,
  },
  {
    id: 'tn8',
    icon: 'User',
    title: 'Associate Assigned',
    message: 'Khalid Bin-Salman has been assigned to perform procedures on Jeddah Hospitality file.',
    client: 'Jeddah Hospitality Holdings',
    timestamp: 'Yesterday',
    action: { label: 'View File', route: '/team/files', tone: 'amber' },
    unread: true,
  },
]

export const teamStatusNotifications = [
  { id: 'sn1', title: 'Document Accepted', message: 'Fixed Asset Register accepted for Eastern Petrochemical Supplies.', timestamp: '6 hours ago' },
  { id: 'sn2', title: 'Stage Update', message: 'Arabian Cloud Computing advanced to Stage 4: Quality Review.', timestamp: 'Yesterday' },
  { id: 'sn3', title: 'Meeting Confirmed', message: 'Year-End Planning Kickoff confirmed for Riyadh Fintech Group.', timestamp: '2 days ago' },
]

export const teamLongPendingItems = [
  { client: 'Ranco Projects', daysStalled: 11 },
  { client: 'Al-Rajhi Heavy Industries', daysStalled: 9 },
  { client: 'National Medical Care Co.', daysStalled: 8 },
]

// ── Meetings ─────────────────────────────────────────────────────────────
export const teamMeetings = [
  { id: 'm1', subject: 'Q3 Revenue Cutoff Discussion', client: 'Al-Marai Logistics JSC', auditor: 'ABCPA', date: '08 Nov 2024', time: '10:00 AM AST', duration: '1 Hour', status: 'Confirmed' },
  { id: 'm2', subject: 'GOSI Reconciliation Review', client: 'Jeddah Hospitality Holdings', auditor: 'ABCPA', date: '09 Nov 2024', time: '02:00 PM AST', duration: '45 Min', status: 'Pending' },
  { id: 'm3', subject: 'Year-End Planning Kickoff', client: 'Riyadh Fintech Group', auditor: 'ABCPA', date: '11 Nov 2024', time: '11:00 AM AST', duration: '1.5 Hours', status: 'Confirmed' },
  { id: 'm4', subject: 'Inventory Count Observation', client: 'Eastern Petrochemical Supplies', auditor: 'MISCPA', date: '13 Nov 2024', time: '09:00 AM AST', duration: '2 Hours', status: 'Pending' },
  { id: 'm5', subject: 'Final AFS Review', client: 'Arabian Cloud Computing', auditor: 'MISCPA', date: '14 Nov 2024', time: '03:00 PM AST', duration: '1 Hour', status: 'Confirmed' },
]
export const teamMeetingsCompletedCount = 4

// ── Direct Chat ──────────────────────────────────────────────────────────
export const teamConversations = [
  {
    id: 'al-marai',
    name: 'Al-Marai Logistics JSC',
    initials: 'AL',
    preview: 'Gathering the signed PODs from Da...',
    timestamp: '11:15 AM',
    unread: 2,
    engagementRef: 'ENG-2024-8841',
    auditor: 'ABCPA',
    auditType: 'Proper',
    stage: 'Stage 3: Substantive Testing',
    messages: [
      { side: 'left', author: 'Fahad Al-Otaibi', timestamp: '10:42 AM', text: 'Please share the October bank statement when ready.' },
      { side: 'right', author: 'Al-Marai Logistics', timestamp: '11:00 AM', text: 'The warehouse logistics batch for that shipment was finalized on Sept 30.' },
      { side: 'right', author: 'Al-Marai Logistics', timestamp: '11:15 AM', text: 'Gathering the signed PODs from Dammam depot right now.' },
    ],
  },
  {
    id: 'kingdom-retail',
    name: 'Kingdom Retail Holdings LLC',
    initials: 'KR',
    preview: 'Confirmed, the note 12 Zakat...',
    timestamp: 'Yesterday',
    unread: 0,
    engagementRef: 'KSA-2024-8841',
    auditor: 'ABCPA',
    auditType: 'Proper',
    stage: 'Stage 4: Draft Review',
    messages: [
      { side: 'left', author: 'Fahad Al-Otaibi', timestamp: 'Yesterday, 3:10 PM', text: 'Please review the related party disclosure on Note 7.' },
      { side: 'right', author: 'Kingdom Retail', timestamp: 'Yesterday, 4:02 PM', text: 'Confirmed, the note 12 Zakat provision also reviewed.' },
    ],
  },
  {
    id: 'jeddah-hospitality',
    name: 'Jeddah Hospitality Holdings',
    initials: 'JH',
    preview: 'We will send the F&B revenue...',
    timestamp: 'Yesterday',
    unread: 1,
    engagementRef: 'ENG-2024-5119',
    auditor: 'ABCPA',
    auditType: 'Proper',
    stage: 'Stage 3: Substantive Testing',
    messages: [
      { side: 'left', author: 'Fahad Al-Otaibi', timestamp: 'Yesterday, 9:20 AM', text: 'Can you confirm the F&B revenue split by outlet for Q3?' },
      { side: 'right', author: 'Jeddah Hospitality', timestamp: 'Yesterday, 1:45 PM', text: 'We will send the F&B revenue breakdown by end of day.' },
    ],
  },
  {
    id: 'riyadh-fintech',
    name: 'Riyadh Fintech Group',
    initials: 'RFG',
    preview: 'The SAMA portal export is ready...',
    timestamp: '2 days ago',
    unread: 0,
    engagementRef: 'ENG-2024-7732',
    auditor: 'ABCPA',
    auditType: 'Proper',
    stage: 'Stage 2: PBC Collection',
    messages: [
      { side: 'left', author: 'Fahad Al-Otaibi', timestamp: '2 days ago', text: 'Please export the SAMA compliance filings for FY2024.' },
      { side: 'right', author: 'Riyadh Fintech', timestamp: '2 days ago', text: 'The SAMA portal export is ready, sharing shortly.' },
    ],
  },
  {
    id: 'eastern-petrochemical',
    name: 'Eastern Petrochemical Supplies',
    initials: 'EP',
    preview: 'Inventory count sheets attached...',
    timestamp: '3 days ago',
    unread: 0,
    engagementRef: 'ENG-2024-4902',
    auditor: 'MISCPA',
    auditType: 'Proper',
    stage: 'Stage 4: Quality Review',
    messages: [
      { side: 'left', author: 'Fahad Al-Otaibi', timestamp: '3 days ago', text: 'Please share the year-end inventory count sheets.' },
      { side: 'right', author: 'Eastern Petrochemical', timestamp: '3 days ago', text: 'Inventory count sheets attached for your review.' },
    ],
  },
  {
    id: 'arabian-cloud',
    name: 'Arabian Cloud Computing',
    initials: 'AC',
    preview: 'Thank you, we have reviewed...',
    timestamp: '4 days ago',
    unread: 0,
    engagementRef: 'ENG-2024-6590',
    auditor: 'MISCPA',
    auditType: 'Proper',
    stage: 'Stage 4: Quality Review',
    messages: [
      { side: 'left', author: 'Fahad Al-Otaibi', timestamp: '4 days ago', text: 'The draft financial statements are ready for your review.' },
      { side: 'right', author: 'Arabian Cloud', timestamp: '4 days ago', text: 'Thank you, we have reviewed and have no comments.' },
    ],
  },
]

// ── Per-client dashboard (Al-Marai) donut + supporting lists ───────────────
export const teamClientRequirementsBreakdown = [
  { name: 'Accepted', value: 78, color: '#059669' },
  { name: 'Under Review', value: 3, color: '#D97706' },
  { name: 'Rejected', value: 2, color: '#DC2626' },
  { name: 'Pending', value: 1, color: '#94A3B8' },
]

export const teamClientDocuments = [
  { name: 'Audited Revenue Ledger', status: 'Accepted', reviewer: 'K. Al-Otaibi', timestamp: '2 days ago' },
  { name: 'Top 10 Customer Contracts', status: 'Under Review', reviewer: 'S. Crawford', timestamp: 'Today 10:14AM' },
  { name: 'ECL Model Matrix', status: 'Rejected', reviewer: 'T. Al-Ghamdi', timestamp: '3 days ago' },
  { name: 'Year-end Cutoff Invoices', status: 'Pending Client', reviewer: '—', timestamp: '—' },
  { name: 'ZATCA E-Invoicing Samples', status: 'Uploaded Processing', reviewer: '—', timestamp: 'Today' },
]

// ── Module 4 — Audit Manager & Assistant Manager Portal ─────────────────────
export const managerUser = {
  name: 'Tariq Al-Ghamdi',
  role: 'Audit Manager',
  department: 'ABCPA',
  initials: 'TG',
}

export const departmentStats = {
  totalActive: 148,
  onTrack: 121,
  atRisk: 18,
  critical: 3,
  unallocated: 6,
  abcpaFiles: 89,
}

export const managerActionCards = [
  {
    id: 'critical',
    tone: 'alert-red',
    title: '3 Tier-3 Critical Files — Immediate Action',
    icon: 'Clock',
    action: 'Escalate Now',
    route: '/manager/escalation',
  },
  {
    id: 'transfers',
    tone: 'amber',
    title: '2 Staff Department Transfers Pending Approval',
    icon: 'Users',
    action: 'Review Transfers',
    route: '/manager/workload',
  },
  {
    id: 'parked',
    tone: 'amber',
    title: '8 Files Parked >14 Days — Review Required',
    icon: 'PauseCircle',
    action: 'Review Parking',
    route: '/manager/status-board',
  },
  {
    id: 'invoices',
    tone: 'alert-red',
    title: 'SAR 84K Overdue Invoices',
    icon: 'Banknote',
    action: 'Follow Up',
    route: null,
  },
]

export const abcpaPortfolio = [
  { name: 'Active', value: 64, color: '#059669' },
  { name: 'Parked', value: 12, color: '#D97706' },
  { name: 'On Hold', value: 8, color: '#CA8A04' },
  { name: 'With Reviewer', value: 5, color: '#2563EB' },
]
export const firmPerformanceSummary = { avgTurnaround: '18.4 Days', avgAccuracy: '92%' }

export const leadWorkload = [
  { name: 'Fahad Al-Otaibi', seniority: 'Senior Lead', files: 14, queries: 8, docs: 12, parked: 2 },
  { name: 'Sarah Al-Harbi', seniority: 'Lead Senior', files: 11, queries: 5, docs: 6, parked: 1 },
  { name: 'Rayan Darwish', seniority: 'Lead', files: 9, queries: 3, docs: 4, parked: 0 },
  { name: 'Majed Al-Subaie', seniority: 'Lead', files: 7, queries: 2, docs: 2, parked: 0 },
  { name: 'Nadia Hassan', seniority: 'Lead', files: 13, queries: 11, docs: 18, parked: 3 },
  { name: 'Omar Bin-Shehri', seniority: 'Lead', files: 6, queries: 1, docs: 3, parked: 0 },
]
export function capacityTone(files) {
  if (files > 13) return 'alert-red'
  if (files >= 10) return 'amber'
  return 'emerald'
}

export const parkedFilesReview = [
  { client: 'Qassim Petrochemical', reason: 'Capacity', days: 19 },
  { client: 'Al-Yamamah Steel', reason: 'Reviewer Busy', days: 14 },
  { client: 'Gulf Star Logistics', reason: 'Awaiting Internal Input', days: 11 },
]

export const managerTodaysActivity = [
  { client: 'Al-Rajhi Heavy Industries', event: 'Lead flagged missing ZATCA XML cryptographic data', timestamp: '25 mins ago' },
  { client: 'Fawaz Telecommunications', event: 'Reviewer requested IFRS 16 lease restatement support', timestamp: '1 hour ago' },
  { client: 'Dammam Hospitality Holdings', event: 'File moved to On Hold — client unresponsive', timestamp: '2 hours ago' },
  { client: 'Noor FinTech Micro-Lending', event: 'Shariah board sign-off received', timestamp: '3 hours ago' },
  { client: 'Tamimi King Retailers', event: 'Audit opinion draft submitted for review', timestamp: 'Yesterday' },
]
// ── File Status Board (screen 24) ───────────────────────────────────────────
export const statusBoardFiles = [
  {
    id: 'AR',
    client: 'Al-Rajhi Heavy Industries',
    engagement: 'KSA-2024-8841 Statutory Audit ABCPA+IFRS',
    team: 'Fahad O. + Partner T.Ghamdi',
    status: 'Active',
    daysInState: 14,
    note: 'Missing ZATCA XML Cryptographic data',
  },
  {
    id: 'FT',
    client: 'Fawaz Telecommunications',
    engagement: 'KSA-2024-9104 Half-Year Review ISRE 2410',
    team: 'Sarah K. + Partner B.Shehri',
    status: 'With Reviewer',
    daysInState: 4,
    note: 'High risk IFRS 16 lease restatement',
  },
  {
    id: 'NB',
    client: 'Noor FinTech Micro-Lending',
    engagement: 'KSA-2024-7729 Shariah Board & Annual Audit',
    team: 'Rayan D. + Partner T.Ghamdi',
    status: 'Active',
    daysInState: 2,
    note: 'Smooth — no blockers',
  },
  {
    id: 'DH',
    client: 'Dammam Hospitality Holdings',
    engagement: 'KSA-2024-6310 Consolidated Statutory & Zakat',
    team: 'Majed S. + Partner W.Mansoor',
    status: 'On Hold',
    daysInState: 8,
    note: 'Client unresponsive >5 days',
  },
  {
    id: 'QP',
    client: 'Qassim Petrochemical Supplies',
    engagement: 'KSA-2024-5201 Interim Q3 Valuation',
    team: 'Khaled B. + Partner T.Ghamdi',
    status: 'Parked',
    daysInState: 19,
    note: 'Deferred pending external confirmation',
  },
  {
    id: 'RH',
    client: 'Red Sea Logistics Corp',
    engagement: 'KSA-2024-4190 Statutory Audit ISA 700',
    team: 'Nadia H. + Partner T.Ghamdi',
    status: 'Active',
    daysInState: 6,
    note: 'Zakat clearance note unadjusted',
  },
  {
    id: 'TK',
    client: 'Tamimi King Retailers',
    engagement: 'KSA-2024-3312 Annual Statutory Sign-off',
    team: 'Omar B. + Partner B.Shehri',
    status: 'With Reviewer',
    daysInState: 2,
    note: 'Audit opinion draft ready',
  },
  {
    id: 'AP',
    client: 'Al-Andalus Pharmaceutical',
    engagement: 'KSA-2024-1188 Statutory Compliance',
    team: 'Leila F. + Partner T.Ghamdi',
    status: 'Active',
    daysInState: 11,
    note: 'Inventory sampling cutoff mismatch',
  },
]

export const statusBoardFilterCounts = { All: 148, Active: 64, 'With Reviewer': 24, 'On Hold': 8, Parked: 12 }

// ── Workload View (screen 25) ───────────────────────────────────────────────
export const workloadSummary = { totalLeads: 15, totalActiveFiles: 148, avgLoad: 9.9 }

export const unallocatedFiles = [
  { id: 'uf-1', client: 'Al-Faisaliah Trading Co.', auditType: 'Proper', recommendedLead: 'Omar Bin-Shehri' },
  { id: 'uf-2', client: 'Hail Regional Bank Services', auditType: 'Disclaimer', recommendedLead: 'Majed Al-Subaie' },
  { id: 'uf-3', client: 'Tabuk Renewable Energy Co.', auditType: 'Proper', recommendedLead: 'Rayan Darwish' },
]

// ── Annual Team Plan (screen 26) ────────────────────────────────────────────
export const teamPlanSummary = { totalLeads: 15, totalAssociates: 25, lastUpdated: '01 Jan 2026', status: 'Active' }

export const abcpaTeamPlan = [
  {
    id: 'lead-fahad',
    name: 'Fahad Al-Otaibi',
    seniority: 'Senior Lead',
    associates: [
      { id: 'assoc-khalid', name: 'Khalid Bin-Salman' },
      { id: 'assoc-sara', name: 'Sara Mahmoud' },
      { id: 'assoc-ali', name: 'Ali Hassan' },
    ],
  },
  {
    id: 'lead-sarah',
    name: 'Sarah Al-Harbi',
    seniority: 'Lead Senior',
    associates: [
      { id: 'assoc-nour', name: 'Nour Al-Farsi' },
      { id: 'assoc-james', name: 'James Mathew' },
    ],
  },
  {
    id: 'lead-rayan',
    name: 'Rayan Darwish',
    seniority: 'Lead',
    associates: [
      { id: 'assoc-priya', name: 'Priya Menon' },
      { id: 'assoc-fatima', name: 'Fatima Al-Zahra' },
    ],
  },
]
// ── Escalation Monitor (screen 27) ──────────────────────────────────────────
export const escalationTier1 = [
  { client: 'Al-Rajhi Heavy Industries', band: 'SAR 50M+ Band', due: '12 Nov 2024', daysRemaining: 3, lead: 'Fahad Al-Otaibi' },
  { client: 'Tamimi King Retailers', band: 'SAR 10M-50M Band', due: '14 Nov 2024', daysRemaining: 5, lead: 'Omar Bin-Shehri' },
  { client: 'Noor FinTech', band: 'SAR 5M-10M Band', due: '15 Nov 2024', daysRemaining: 5, lead: 'Rayan Darwish' },
]

export const escalationTier2 = [
  { client: 'Dammam Hospitality Holdings', band: 'SAR 10M-50M Band', due: '01 Nov 2024', daysOverdue: 8, lead: 'Majed Al-Subaie' },
  { client: 'Qassim Petrochemical', band: 'SAR 5M-10M Band', due: '28 Oct 2024', daysOverdue: 12, lead: 'Nadia Hassan' },
]

export const escalationTier3 = [
  { client: 'Al-Yamamah Steel Industries', band: 'SAR 50M+ Band', due: '18 Oct 2024', daysOverdue: 18, lead: 'Fahad Al-Otaibi', note: 'Partner action required immediately.' },
  { client: 'Saudi Petrochem Logistics', band: 'SAR 20M-50M Band', due: '22 Oct 2024', daysOverdue: 14, lead: 'Nadia Hassan', note: null },
]

export const predictiveRisk = [
  { client: 'Red Sea Logistics Corp', lead: 'Nadia Hassan', projectedBreach: '20 Nov 2024' },
  { client: 'Al-Andalus Pharmaceutical', lead: 'Fahad Al-Otaibi', projectedBreach: '22 Nov 2024' },
  { client: 'Fawaz Telecommunications', lead: 'Sarah Al-Harbi', projectedBreach: '25 Nov 2024' },
]

export const REVENUE_BANDS = ['All Revenue Bands', 'SAR 50M+ Band', 'SAR 20M-50M Band', 'SAR 10M-50M Band', 'SAR 5M-10M Band']

// ── Performance Analysis (screen 28) ────────────────────────────────────────
export const performanceSummary = {
  totalActiveFiles: 89,
  avgTurnaround: 18.4,
  avgAccuracy: 92,
  reviewPointsRaised: 11,
}

export const leadPerformance = [
  {
    name: 'Fahad Al-Otaibi',
    activeFiles: 14,
    avgTurnaround: 18.2,
    reviewPoints: 3,
    queriesPerFile: 4.2,
    docAcceptance: 91,
    completed: 8,
    status: 'On Track',
  },
  {
    name: 'Sarah Al-Harbi',
    activeFiles: 11,
    avgTurnaround: 15.8,
    reviewPoints: 1,
    queriesPerFile: 3.1,
    docAcceptance: 94,
    completed: 6,
    status: 'On Track',
  },
  {
    name: 'Rayan Darwish',
    activeFiles: 9,
    avgTurnaround: 12.4,
    reviewPoints: 0,
    queriesPerFile: 2.8,
    docAcceptance: 97,
    completed: 5,
    status: 'Excellent',
  },
]

export const associatePerformance = [
  { name: 'Khalid Bin-Salman', lead: 'Fahad Al-Otaibi', filesAssigned: 8, procedureCompletion: 78, docAcceptance: 91, reviewPoints: 2, status: 'On Track' },
  { name: 'Sara Mahmoud', lead: 'Sarah Al-Harbi', filesAssigned: 6, procedureCompletion: 85, docAcceptance: 94, reviewPoints: 1, status: 'On Track' },
  { name: 'Ali Hassan', lead: 'Fahad Al-Otaibi', filesAssigned: 5, procedureCompletion: 91, docAcceptance: 96, reviewPoints: 0, status: 'Excellent' },
  { name: 'Priya Menon', lead: 'Rayan Darwish', filesAssigned: 4, procedureCompletion: 92, docAcceptance: 98, reviewPoints: 0, status: 'Excellent' },
]

export const performanceReviewPoints = [
  { ref: 'RP-001', file: 'Al-Marai Logistics', raisedBy: 'Auditor Review', raisedAgainst: 'Fahad Al-Otaibi', date: '03 Nov 2024', status: 'Cleared' },
  { ref: 'RP-002', file: 'Riyadh Fintech', raisedBy: 'Auditor Review', raisedAgainst: 'Khalid Bin-Salman', date: '01 Nov 2024', status: 'Pending' },
  { ref: 'RP-003', file: 'Al-Rajhi Capital', raisedBy: 'Auditor Review', raisedAgainst: 'Sarah Al-Harbi', date: '28 Oct 2024', status: 'Cleared' },
  { ref: 'RP-004', file: 'Eastern Petrochemical', raisedBy: 'Auditor Review', raisedAgainst: 'Sara Mahmoud', date: '25 Oct 2024', status: 'Cleared' },
]

export const performanceTrend = [
  { month: 'Jun', turnaround: 24, accuracy: 87 },
  { month: 'Jul', turnaround: 22, accuracy: 88 },
  { month: 'Aug', turnaround: 21, accuracy: 89 },
  { month: 'Sep', turnaround: 19, accuracy: 90 },
  { month: 'Oct', turnaround: 18.4, accuracy: 91 },
  { month: 'Nov', turnaround: 18, accuracy: 92 },
]

// ── Manager notifications (bell dropdown + /manager/notifications) ─────────
export const managerNotifications = [
  { id: 'mn1', title: 'Tier-3 Escalation — Al-Yamamah Steel', message: '18 days overdue. Partner action required immediately.', timestamp: '10 mins ago', route: '/manager/escalation' },
  { id: 'mn2', title: 'File Parked — Qassim Petrochemical', message: 'Parked 19 days — capacity constraint on Lead.', timestamp: '1 hour ago', route: '/manager/status-board' },
  { id: 'mn3', title: 'Transfer Request Pending', message: '2 staff department transfers awaiting your approval.', timestamp: '2 hours ago', route: '/manager/workload' },
  { id: 'mn4', title: 'Review Point Raised — Riyadh Fintech', message: 'RP-002 raised against Khalid Bin-Salman.', timestamp: '3 hours ago', route: '/manager/performance' },
  { id: 'mn5', title: 'Workload Alert — Nadia Hassan', message: '13 active files — over capacity threshold.', timestamp: 'Yesterday', route: '/manager/workload' },
]

// ── Module 5 — Front Office Portal ──────────────────────────────────────────
export const foUser = { name: 'Layla Al-Khatib', role: 'Front Office', initials: 'LK', id: 'layla' }

export const foNotifications = [
  { title: '4 Proposals Awaiting Approval', message: 'Al-Bashir, Madinah Contracting and 2 others need your review.', timestamp: '25 mins ago' },
  { title: '3 Proposals Expiring Soon', message: 'Gulf Star Logistics expires in 2 days.', timestamp: '1 hour ago' },
  { title: 'New Lead Added', message: 'Eastern Tech Solutions submitted via CRM.', timestamp: '2 hours ago' },
  { title: 'Payment Received', message: 'SAR 24,000 received from Riyadh Food Industries.', timestamp: '3 hours ago' },
]
export const foRecentActivity = [
  { type: 'New Registration', client: 'Tabuk Renewable Energy Co.', timestamp: '25 mins ago', status: 'Accepted' },
  { type: 'Proposal Sent', client: 'Hail Agricultural Co.', timestamp: '1 hour ago', status: 'Sent to Client' },
  { type: 'EL Captured', client: 'Al-Rajhi Capital Audits', timestamp: '2 hours ago', status: 'Accepted' },
  { type: 'Lead Scored', client: 'Northern Cement Factory', timestamp: '3 hours ago', status: 'Pending' },
  { type: 'Proposal Approved', client: 'Riyadh Food Industries', timestamp: 'Yesterday', status: 'Accepted' },
]

export const foFollowUpLeads = [
  { company: 'Al-Bashir Trading Co.', score: 'High', lastContact: '03 Nov', followUpType: 'Call' },
  { company: 'Madinah Contracting LLC', score: 'High', lastContact: '01 Nov', followUpType: 'Email' },
  { company: 'Eastern Tech Solutions', score: 'Medium', lastContact: '02 Nov', followUpType: 'Call' },
  { company: 'Al-Nakheel Retail Group', score: 'Medium', lastContact: '25 Oct', followUpType: 'Proposal' },
  { company: 'Riyadh Food Industries', score: 'Medium', lastContact: '30 Oct', followUpType: 'Email' },
]
export const SCORE_TONE = { High: 'bg-yellow-100 text-yellow-700 border-yellow-300', Medium: 'bg-blue-100 text-blue-700 border-blue-300', Low: 'bg-slate-100 text-slate-500 border-slate-300' }

export const foExpiringProposals = [
  { company: 'Gulf Star Logistics', sentDate: '28 Oct 2024', expiryDate: '27 Nov 2024', daysRemaining: 2 },
  { company: 'Eastern Tech Solutions', sentDate: '01 Nov 2024', expiryDate: '01 Dec 2024', daysRemaining: 6 },
  { company: 'Al-Nakheel Retail Group', sentDate: '25 Oct 2024', expiryDate: '24 Nov 2024', daysRemaining: 1 },
]
export const FOLLOWUP_TONE = {
  Overdue: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  Scheduled: 'bg-emerald/10 text-emerald border-emerald/30',
  'Due Today': 'bg-amber/10 text-amber border-amber/30',
  'Not Started': 'bg-slate-100 text-slate-500 border-slate-300',
}
// ── Proposals & Engagement Letters (screen 32) ──────────────────────────────
export const foProposals = [
  { id: 'al-bashir', client: 'Al-Bashir Trading Co.', auditor: 'ABCPA', auditType: 'Proper', fee: 18500, createdBy: 'Layla Al-Khatib', createdDate: '04 Nov', status: 'Awaiting Approval' },
  { id: 'madinah-contracting', client: 'Madinah Contracting LLC', auditor: 'MISCPA', auditType: 'Proper', fee: 24000, createdBy: 'Layla Al-Khatib', createdDate: '03 Nov', status: 'Awaiting Approval' },
  { id: 'gulf-star', client: 'Gulf Star Logistics', auditor: 'ABCPA', auditType: 'Disclaimer', fee: 8500, createdBy: 'Layla Al-Khatib', createdDate: '02 Nov', status: 'Awaiting Approval' },
  { id: 'eastern-tech', client: 'Eastern Tech Solutions', auditor: 'MISCPA', auditType: 'Proper', fee: 15000, createdBy: 'Layla Al-Khatib', createdDate: '01 Nov', status: 'Awaiting Approval' },
]
export const foProposalFilterCounts = { All: 48, 'Awaiting Approval': 4, 'Sent to Client': 28, Signed: 12, Expired: 4 }

export const foSentProposals = [
  { client: 'Riyadh Food Industries', sentDate: '30 Oct 2024', opened: true, daysSince: 6 },
  { client: 'Hail Agricultural Co.', sentDate: '28 Oct 2024', opened: false, daysSince: 8 },
  { client: 'Al-Andalus Pharmaceutical', sentDate: '25 Oct 2024', opened: true, daysSince: 11 },
]
// ── Proposal Preview & Approval (screen 33) ─────────────────────────────────
export const foProposalDetail = {
  reference: 'PROP-2024-1247',
  client: 'Al-Bashir Trading Co. LLC',
  crNumber: '1010XXXXXX',
  city: 'Riyadh, KSA',
  contact: 'Mr. Abdullah Al-Bashir — Chief Finance Officer',
  auditType: 'Proper Audit',
  auditor: 'ABCPA',
  fee: 18500,
  createdBy: 'Layla Al-Khatib',
  createdDate: '04 Nov 2024',
  pulledDate: '04 Nov 2024 at 09:32 AM',
  expiryDate: '04 Dec 2024',
}

// ── Module 6 — Management Portal ────────────────────────────────────────────
// Front Office managers Management can message or call (sample addresses).
export const mgmtFOContacts = {
  Allen: { email: 'allen@analytix.sa' },
  'M Ali': { email: 'm.ali@analytix.sa' },
  Fayis: { email: 'fayis@analytix.sa' },
  Uvais: { email: 'uvais@analytix.sa' },
  Azhar: { email: 'azhar@analytix.sa' },
}

// Escalation level Management can see (client portal levels: 1 Audit Lead, 2 Audit Manager, 3 Front Office Manager).
export const MGMT_VISIBLE_ESCALATION_TIER = 3

export const mgmtUser = { name: 'Mohammed Al-Rashid', role: 'Partner', department: 'Management', initials: 'MR' }
export const mgmtAbcpaPortfolio = {
  label: 'ABCPA Department — 89 Files',
  total: 89,
  manager: 'Tariq Al-Ghamdi',
  am: 'Sarah Al-Mansoor',
  breakdown: [
    { label: 'Active', value: 64, color: '#059669' },
    { label: 'Parked', value: 12, color: '#D97706' },
    { label: 'On Hold', value: 8, color: '#CA8A04' },
    { label: 'With Reviewer', value: 5, color: '#2563EB' },
  ],
  urgentFiles: [
    { client: 'Al-Rajhi Heavy Industries', days: 14, status: 'Active' },
    { client: 'Dammam Hospitality', days: 8, status: 'On Hold' },
    { client: 'Qassim Petrochemical', days: 19, status: 'Parked' },
  ],
}

export const mgmtMiscpaPortfolio = {
  label: 'MISCPA Department — 59 Files',
  total: 59,
  manager: 'Khalid Al-Farsi',
  am: 'Lina Al-Zahrani',
  breakdown: [
    { label: 'Active', value: 38, color: '#059669' },
    { label: 'Parked', value: 8, color: '#D97706' },
    { label: 'On Hold', value: 5, color: '#CA8A04' },
    { label: 'With Reviewer', value: 8, color: '#2563EB' },
  ],
  urgentFiles: [
    { client: 'Fawaz Telecom', days: 4, status: 'With Reviewer' },
    { client: 'Al-Andalus Pharmaceutical', days: 11, status: 'Active' },
    { client: 'Saudi Petrochem Logistics', days: 14, status: 'Parked' },
  ],
}
export const mgmtLeadConversion = [
  { label: 'Leads', value: 2148 },
  { label: 'Contacted', value: 890 },
  { label: 'Proposals Sent', value: 87 },
  { label: 'Signed', value: 54 },
]
export const mgmtConversionRate = 17
// ── Management Dashboard — new data blocks ──────────────────────────────────

// FO-manager-wise file allocation (business-development / client-acquisition level —
// the detail shareholders care about; individual audit-staff assignments are not shown here)
export const mgmtFOFiles = [
  { fo: 'AL', name: 'Allen', role: 'FO Senior', color: '#DC2626', total: 36, active: 32, won: 14, pipeline: 6, revenue: 302000 },
  { fo: 'MA', name: 'M Ali', role: 'Front Officer', color: '#D97706', total: 35, active: 30, won: 11, pipeline: 8, revenue: 293000 },
  { fo: 'FY', name: 'Fayis', role: 'Front Officer', color: '#2563EB', total: 29, active: 25, won: 9, pipeline: 5, revenue: 243000 },
  { fo: 'UV', name: 'Uvais', role: 'Front Officer', color: '#0F766E', total: 27, active: 23, won: 8, pipeline: 4, revenue: 226000 },
  { fo: 'AZ', name: 'Azhar', role: 'Front Officer', color: '#7C3AED', total: 21, active: 17, won: 6, pipeline: 5, revenue: 176000 },
]

// Escalation levels raised from the client portal: 1 Audit Lead, 2 Audit Manager,
// 3 Front Office Manager. Management is only shown level 3, so every management
// view reads mgmtAllEscalations (filtered here) and never the raw records.
const allEscalationRecords = [
  { id: 'ESC-041', client: 'Al-Yamamah Steel Industries', dept: 'ABCPA', tier: 3, daysOverdue: 18, lead: 'Fahad Al-Otaibi', date: '05 Nov 2024', reason: 'TB schedules outstanding >14 days; client unresponsive to 3 follow-ups', status: 'Open', raisedBy: 'Tariq Al-Ghamdi', fo: 'Allen' },
  { id: 'ESC-040', client: 'Saudi Petrochem Logistics', dept: 'MISCPA', tier: 3, daysOverdue: 14, lead: 'Khalid Al-Farsi', date: '04 Nov 2024', reason: 'Statutory deadline breach imminent; audit plan not signed off', status: 'Open', raisedBy: 'Khalid Al-Farsi', fo: 'Uvais' },
  { id: 'ESC-039', client: 'Dammam Hospitality', dept: 'ABCPA', tier: 2, daysOverdue: 8, lead: 'Majed Al-Subaie', date: '04 Nov 2024', reason: 'Related party disclosures disputed; management representation delayed', status: 'Under Review', raisedBy: 'Majed Al-Subaie' },
  { id: 'ESC-038', client: 'Al-Rajhi Heavy Industries', dept: 'ABCPA', tier: 2, daysOverdue: 11, lead: 'Rijin Philip', date: '02 Nov 2024', reason: 'Cash & bank confirmations not received from 2 banks after 30-day chase', status: 'Resolved', raisedBy: 'Rijin Philip' },
  { id: 'ESC-037', client: 'Noor FinTech Micro-Lending', dept: 'MISCPA', tier: 2, daysOverdue: 6, lead: 'Pavithra Joy', date: '01 Nov 2024', reason: 'Provisioning policy disagreement — client seeking qualified opinion', status: 'Resolved', raisedBy: 'Ansa Davis' },
  { id: 'ESC-036', client: 'Gulf Contracting Est.', dept: 'ABCPA', tier: 3, daysOverdue: 22, lead: 'Jefin Jose', date: '30 Oct 2024', reason: 'Contract work-in-progress valuation dispute; legal counsel involved', status: 'Resolved', raisedBy: 'Tariq Al-Ghamdi', fo: 'M Ali' },
  { id: 'ESC-035', client: 'Tabuk Foods Co.', dept: 'MISCPA', tier: 2, daysOverdue: 5, lead: 'Deepak Suresh', date: '28 Oct 2024', reason: 'Inventory count discrepancy — SAR 1.8M variance unresolved at cut-off', status: 'Resolved', raisedBy: 'Khalid Al-Farsi' },
  { id: 'ESC-034', client: 'Al-Andalus Pharmaceutical', dept: 'MISCPA', tier: 2, daysOverdue: 9, lead: 'Yousef Al-Dosari', date: '25 Oct 2024', reason: 'Regulatory licence not renewed; going concern implication flagged', status: 'Resolved', raisedBy: 'Lina Al-Zahrani' },
  { id: 'ESC-033', client: 'Arabian Cloud Computing', dept: 'ABCPA', tier: 2, daysOverdue: 4, lead: 'Sara Al-Qahtani', date: '22 Oct 2024', reason: 'Revenue recognition policy — IFRS 15 variable consideration treatment disputed', status: 'Resolved', raisedBy: 'Noura Al-Zahrani' },
  { id: 'ESC-032', client: 'Jeddah Hospitality Holdings', dept: 'ABCPA', tier: 3, daysOverdue: 19, lead: 'Omar Al-Harbi', date: '18 Oct 2024', reason: 'Prior year restatement identified; comparative figures to be restated', status: 'Resolved', raisedBy: 'Tariq Al-Ghamdi', fo: 'Azhar' },
]

export const mgmtAllEscalations = allEscalationRecords.filter(e => e.tier === MGMT_VISIBLE_ESCALATION_TIER)

// Searchable client directory (full 148-file universe — abbreviated for demo)
export const mgmtClientDirectory = [
  { code: 'ZK-001', name: 'Al-Rowad Trading Co.', sector: 'Trading', city: 'Riyadh', fy: 'FY2025', turnover: 'SAR 42.0M', fee: 'SAR 38K', progress: 58, status: 'crit', phase: 'Under Audit', lead: 'Rijin Philip', fo: 'Fayis', dept: 'ABCPA', feePaid: 'SAR 19K', balance: 'SAR 19K', dueDate: '20 Sep 2026', exceptions: 3 },
  { code: 'ZK-002', name: 'Najd Manufacturing Ltd.', sector: 'Manufacturing', city: 'Dammam', fy: 'FY2025', turnover: 'SAR 96.4M', fee: 'SAR 72K', progress: 34, status: 'warn', phase: 'Data Collection', lead: 'Deepak Suresh', fo: 'Uvais', dept: 'MISCPA', feePaid: 'SAR 36K', balance: 'SAR 36K', dueDate: '15 Oct 2026', exceptions: 1 },
  { code: 'ZK-003', name: 'Gulf Contracting Est.', sector: 'Contracting', city: 'Jeddah', fy: 'FY2025', turnover: 'SAR 61.8M', fee: 'SAR 56K', progress: 82, status: 'ok', phase: 'Draft Issued', lead: 'Ansa Davis', fo: 'M Ali', dept: 'ABCPA', feePaid: 'SAR 56K', balance: 'SAR 0', dueDate: '30 Sep 2026', exceptions: 0 },
  { code: 'ZK-004', name: 'Salam Services WLL', sector: 'Services', city: 'Riyadh', fy: 'FY2025', turnover: 'SAR 12.3M', fee: 'SAR 28K', progress: 18, status: 'warn', phase: 'Onboarding', lead: 'Ansa Davis', fo: 'Azhar', dept: 'MISCPA', feePaid: 'SAR 14K', balance: 'SAR 14K', dueDate: '30 Nov 2026', exceptions: 2 },
  { code: 'ZK-005', name: 'Tabuk Foods Co.', sector: 'FMCG', city: 'Tabuk', fy: 'FY2025', turnover: 'SAR 78.9M', fee: 'SAR 65K', progress: 94, status: 'ok', phase: 'Finalized', lead: 'Deepak Suresh', fo: 'Allen', dept: 'MISCPA', feePaid: 'SAR 65K', balance: 'SAR 0', dueDate: '12 Sep 2026', exceptions: 0 },
  { code: 'ZK-006', name: 'Hijaz Logistics WLL', sector: 'Logistics', city: 'Jeddah', fy: 'FY2025', turnover: 'SAR 33.5M', fee: 'SAR 44K', progress: 46, status: 'warn', phase: 'Under Audit', lead: 'Rijin Philip', fo: 'Fayis', dept: 'ABCPA', feePaid: 'SAR 22K', balance: 'SAR 22K', dueDate: '31 Oct 2026', exceptions: 1 },
  { code: 'ZK-007', name: 'Al-Rajhi Heavy Industries', sector: 'Heavy Industries', city: 'Riyadh', fy: 'FY2025', turnover: 'SAR 214.0M', fee: 'SAR 185K', progress: 67, status: 'warn', phase: 'Under Audit', lead: 'Rijin Philip', fo: 'Allen', dept: 'ABCPA', feePaid: 'SAR 92K', balance: 'SAR 93K', dueDate: '15 Oct 2026', exceptions: 2 },
  { code: 'ZK-008', name: 'Riyadh Fintech Group', sector: 'FinTech', city: 'Riyadh', fy: 'FY2025', turnover: 'SAR 48.7M', fee: 'SAR 52K', progress: 71, status: 'ok', phase: 'Under Audit', lead: 'Sara Al-Qahtani', fo: 'Uvais', dept: 'ABCPA', feePaid: 'SAR 52K', balance: 'SAR 0', dueDate: '28 Oct 2026', exceptions: 0 },
  { code: 'ZK-009', name: 'Qassim Petrochemical Co.', sector: 'Petrochemicals', city: 'Buraidah', fy: 'FY2025', turnover: 'SAR 182.0M', fee: 'SAR 88K', progress: 55, status: 'warn', phase: 'Under Audit', lead: 'Omar Al-Harbi', fo: 'M Ali', dept: 'ABCPA', feePaid: 'SAR 44K', balance: 'SAR 44K', dueDate: '10 Nov 2026', exceptions: 3 },
  { code: 'ZK-010', name: 'Eastern Petrochemical Supplies', sector: 'Petrochemicals', city: 'Dhahran', fy: 'FY2025', turnover: 'SAR 126.4M', fee: 'SAR 98K', progress: 42, status: 'warn', phase: 'Data Collection', lead: 'Yousef Al-Dosari', fo: 'Azhar', dept: 'MISCPA', feePaid: 'SAR 49K', balance: 'SAR 49K', dueDate: '20 Nov 2026', exceptions: 1 },
  { code: 'ZK-011', name: 'Al-Yamamah Steel Industries', sector: 'Steel', city: 'Riyadh', fy: 'FY2025', turnover: 'SAR 310.0M', fee: 'SAR 95K', progress: 28, status: 'crit', phase: 'Data Collection', lead: 'Fahad Al-Otaibi', fo: 'Allen', dept: 'ABCPA', feePaid: 'SAR 47K', balance: 'SAR 48K', dueDate: '05 Nov 2026', exceptions: 5 },
  { code: 'ZK-012', name: 'Arabian Cloud Computing', sector: 'Technology', city: 'Riyadh', fy: 'FY2025', turnover: 'SAR 35.2M', fee: 'SAR 41K', progress: 88, status: 'ok', phase: 'Draft Issued', lead: 'Sara Al-Qahtani', fo: 'Fayis', dept: 'ABCPA', feePaid: 'SAR 41K', balance: 'SAR 0', dueDate: '25 Sep 2026', exceptions: 0 },
]

// ── Firm Analytics (screen 35) ───────────────────────────────────────────────
export const mgmtReportingPeriods = ['Q4 FY2024 (Oct–Dec)', 'Q3 FY2024', 'Q2 FY2024', 'Full Year FY2024']

export const mgmtAnalyticsStats = [
  { label: 'Active Engagements', value: 148, sub: '+18% YoY', subTone: 'emerald' },
  { label: 'Avg Cycle Velocity', value: '26.4 Days', sub: '-4.2d vs FY23', subTone: 'emerald' },
  { label: 'Flagged Discrepancies', value: 'SAR 42.8M', tone: 'alert-red', sub: '91% Resolved', subTone: 'emerald' },
  { label: 'Files Completed This Period', value: 34, tone: 'emerald' },
]

export const mgmtDeptSplit = [
  { label: 'ABCPA', value: 89, pct: 60, color: '#0D1B2A' },
  { label: 'MISCPA', value: 59, pct: 40, color: '#D97706' },
]

export const mgmtStageBreakdown = [
  { label: 'Onboarding', value: 18, color: '#0D1B2A' },
  { label: 'Data Collection', value: 34, color: '#2563EB' },
  { label: 'Under Audit', value: 52, color: '#D97706' },
  { label: 'Draft Issued', value: 26, color: '#CA8A04' },
  { label: 'Finalized', value: 12, color: '#059669' },
  { label: 'Filed', value: 6, color: '#0D9488' },
]

export const mgmtAuditTypeBreakdown = [
  { label: 'Proper Audit', value: 78, color: '#2563EB' },
  { label: 'Disclaimer of Opinion', value: 32, color: '#94A3B8' },
  { label: 'Special Audit', value: 20, color: '#7C3AED' },
  { label: 'Liquidation—Proper', value: 12, color: '#D97706' },
  { label: 'Liquidation—Disclaimer', value: 6, color: '#DC2626' },
]

export const mgmtHealthBreakdown = [
  { label: 'On Track', value: 121, color: '#059669' },
  { label: 'At Risk', value: 18, color: '#D97706' },
  { label: 'Critical', value: 3, color: '#DC2626' },
  { label: 'Parked', value: 6, color: '#94A3B8' },
]
export const mgmtThroughput = [
  { month: 'Jun', value: 28 },
  { month: 'Jul', value: 31 },
  { month: 'Aug', value: 25 },
  { month: 'Sep', value: 34 },
  { month: 'Oct', value: 38 },
  { month: 'Nov', value: 34 },
]
// ── Audit Log — Management View (screen 37) ──────────────────────────────────
// Note: individual staff assignments, transfers and performance reviews are
// operational/HR detail owned by the Manager module (/manager/workload,
// /manager/performance) — the shareholder-facing Management portal only
// surfaces firm- and FO-level (business development) data.
export const mgmtAuditLog = [
  { id: 'al-1', tone: 'alert-red', category: 'FO Escalations', title: 'FO Escalation — Al-Yamamah Steel Industries', description: 'File escalated to Management — 18 days overdue. PBC Bank Confirmation missing.', user: 'Tariq Al-Ghamdi', client: 'Al-Yamamah Steel', dept: 'ABCPA', timestamp: '05 Nov 2024, 09:15 AM' },
  { id: 'al-2', tone: 'emerald', category: 'Proposals', title: 'Proposal Approved & Sent', description: 'Proposal for Al-Bashir Trading Co. approved by FO Manager and sent to client.', user: 'Layla Al-Khatib', client: 'Al-Bashir Trading', dept: 'ABCPA', timestamp: '04 Nov 2024, 04:30 PM' },
  { id: 'al-3', tone: 'alert-red', category: 'FO Escalations', title: 'FO Escalation — Saudi Petrochem Logistics', description: 'File escalated — 14 days overdue. VAT reconciliation discrepancy SAR 14.2M.', user: 'Khalid Al-Farsi', client: 'Saudi Petrochem', dept: 'MISCPA', timestamp: '04 Nov 2024, 03:00 PM' },
  { id: 'al-4', tone: 'blue', category: 'Meetings', title: 'Meeting Scheduled', description: 'Client meeting scheduled — Jeddah Hospitality Holdings — Teams link generated.', user: 'Fahad Al-Otaibi', client: 'Jeddah Hospitality', dept: 'ABCPA', timestamp: '04 Nov 2024, 02:30 PM' },
  { id: 'al-5', tone: 'emerald', category: 'Engagements', title: 'Engagement Letter Captured', description: 'Signed EL captured for Al-Rajhi Capital Audits — engagement confirmed.', user: 'Layla Al-Khatib', client: 'Al-Rajhi Capital', dept: 'ABCPA', timestamp: '04 Nov 2024, 11:00 AM' },
  { id: 'al-6', tone: 'amber', category: 'Stage Changes', title: 'Stage Changed', description: 'Noor FinTech Micro-Lending advanced to Stage 3 Substantive Testing.', user: 'System', client: 'Noor FinTech', dept: 'MISCPA', timestamp: '03 Nov 2024, 09:00 AM' },
  { id: 'al-8', tone: 'emerald', category: 'Engagements', title: 'New Engagement Created', description: 'New engagement created — Eastern Tech Solutions — ABCPA — Proper Audit — SAR 15,000.', user: 'Layla Al-Khatib', client: 'Eastern Tech', dept: 'ABCPA', timestamp: '02 Nov 2024, 09:00 AM' },
  { id: 'al-9', tone: 'blue', category: 'Proposals', title: 'Proposal Generated via Odoo', description: 'Proposal auto-generated by Odoo for Madinah Contracting LLC — MISCPA Proper Audit.', user: 'Odoo System', client: 'Madinah Contracting', dept: 'MISCPA', timestamp: '01 Nov 2024, 10:15 AM' },
  { id: 'al-10', tone: 'emerald', category: 'Stage Changes', title: 'Stage Changed', description: 'Arabian Cloud Computing advanced to Stage 4 Quality Review.', user: 'System', client: 'Arabian Cloud', dept: 'MISCPA', timestamp: '01 Nov 2024, 09:30 AM' },
  { id: 'al-12', tone: 'alert-red', category: 'FO Escalations', title: 'FO Escalation — Al-Yamamah Steel', description: 'Escalated to the Front Office Manager. Partner action required.', user: 'System', client: 'Al-Yamamah Steel', dept: 'ABCPA', timestamp: '31 Oct 2024, 03:00 PM' },
  { id: 'al-13', tone: 'emerald', category: 'Proposals', title: 'Proposal Approved & Sent', description: 'Proposal for Gulf Star Logistics approved and sent — SAR 8,500 Disclaimer.', user: 'Layla Al-Khatib', client: 'Gulf Star', dept: 'ABCPA', timestamp: '30 Oct 2024, 02:00 PM' },
  { id: 'al-14', tone: 'emerald', category: 'Engagements', title: 'Client Account Created', description: 'Client account created for Kingdom Retail Holdings LLC — credentials sent.', user: 'FO System', client: 'Kingdom Retail', dept: 'ABCPA', timestamp: '30 Oct 2024, 08:30 AM' },
  { id: 'al-15', tone: 'emerald', category: 'Engagements', title: 'New Engagement Created', description: 'New engagement — Gulf Star Logistics — ABCPA — Disclaimer of Opinion — SAR 8,500.', user: 'Layla Al-Khatib', client: 'Gulf Star', dept: 'ABCPA', timestamp: '28 Oct 2024, 09:00 AM' },
]

export const mgmtLogEventFilters = ['All Events', 'FO Escalations', 'Proposals', 'Engagements', 'Stage Changes', 'Meetings']

export const mgmtNotifications = [
  { id: 'mn-1', title: 'FO Escalation — Al-Yamamah Steel Industries', message: '18 days overdue. PBC Bank Confirmation missing.', timestamp: '05 Nov 2024, 09:15 AM', route: '/management/dashboard' },
  { id: 'mn-2', title: 'FO Escalation — Saudi Petrochem Logistics', message: '14 days overdue. VAT reconciliation discrepancy SAR 14.2M.', timestamp: '04 Nov 2024, 03:00 PM', route: '/management/dashboard' },
  { id: 'mn-3', title: 'SAR 84K in Overdue Invoices', message: '6 clients overdue on payment — review AR aging.', timestamp: '04 Nov 2024, 01:00 PM', route: '/management/financials' },
]

// ── Financials & Profitability (Management) ─────────────────────────────────
export const mgmtPnlSummary = [
  { label: 'Fees Contracted', value: 'SAR 1.24M', raw: 1240000, tone: 'navy' },
  { label: 'Fees Collected', value: 'SAR 890K', raw: 890000, tone: 'emerald' },
  { label: 'Fees Outstanding', value: 'SAR 352K', raw: 352000, tone: 'amber' },
  { label: 'Written Off (FY2025)', value: 'SAR 18K', raw: 18000, tone: 'alert-red' },
]

export const mgmtRealization = { rate: 86, target: 90, note: 'Billed vs. standard rate · FY2025' }

// Revenue only — no cost/payroll/timesheet data exists in this system to derive
// true profitability or margin, so these are billed-fee figures, not profit.
// Broken down by department and by Front Office manager (business development) —
// not by individual audit staff, which is operational detail owned by the Manager module.
export const mgmtRevenueByDept = [
  { dept: 'ABCPA', revenue: 742000, files: 89 },
  { dept: 'MISCPA', revenue: 498000, files: 59 },
]

export const mgmtWipAging = [
  { bucket: '0–30 days', value: 182000, color: '#059669' },
  { bucket: '31–60 days', value: 96000, color: '#D97706' },
  { bucket: '61–90 days', value: 54000, color: '#DC2626' },
  { bucket: '90+ days', value: 20000, color: '#7C3AED' },
]

export const mgmtMonthlyRevenue = [
  { month: 'Jun', value: 612000 },
  { month: 'Jul', value: 648000 },
  { month: 'Aug', value: 590000 },
  { month: 'Sep', value: 705000 },
  { month: 'Oct', value: 742000 },
  { month: 'Nov', value: 690000 },
]

export const mgmtDeadlineBreaches = [
  { client: 'Al-Yamamah Steel Industries', code: 'ZK-011', dept: 'ABCPA', deadline: '05 Nov 2026', daysLeft: -4, severity: 'crit' },
  { client: 'Saudi Petrochem Logistics', code: 'ZK-018', dept: 'MISCPA', deadline: '08 Nov 2026', daysLeft: -1, severity: 'crit' },
  { client: 'Qassim Petrochemical Co.', code: 'ZK-009', dept: 'ABCPA', deadline: '10 Nov 2026', daysLeft: 2, severity: 'warn' },
  { client: 'Najd Manufacturing Ltd.', code: 'ZK-002', dept: 'MISCPA', deadline: '15 Nov 2026', daysLeft: 5, severity: 'warn' },
]
// ── Firm & FO-Level Performance (Management) ──────────────────────────────────
// Firm-wide execution quality — aggregate only, not attributed to named audit
// staff (that detail lives in the Manager module's own performance view).
export const mgmtFirmExecutionSummary = { avgTurnaround: 17.6, onTimeRate: 90, filesClosedThisPeriod: 34 }

export const mgmtClientSatisfaction = { score: 4.5, responses: 92, note: 'Post-engagement client survey · FY2025' }

export const mgmtFirmPerformanceTrend = [
  { month: 'Jun', turnaround: 20.1, onTime: 81 },
  { month: 'Jul', turnaround: 19.4, onTime: 83 },
  { month: 'Aug', turnaround: 20.8, onTime: 79 },
  { month: 'Sep', turnaround: 18.9, onTime: 86 },
  { month: 'Oct', turnaround: 18.4, onTime: 88 },
  { month: 'Nov', turnaround: 17.6, onTime: 90 },
]
