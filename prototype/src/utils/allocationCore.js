// Process 6.1 — File allocation and workload management (Audit360 Execution Rule Book). Pure rules.
// The Rule Book lists the factors but not how a file is scored; the audit lead decided on a points score from
// the factors, mapped to Low / Medium / High, which the manager can override with a reason.
// The point values and thresholds below are the starting values and live in this one file.

export const AUDIT_TYPE_POINTS = { 'Proper Audit': 2, 'Disclaimer Audit': 0, 'Liquidation Audit': 2, 'Special Audit': 2, 'Agreed-Upon Procedures': 1 }
export const TURNOVER_POINTS = { zero: 0, lt1m: 1, '1to5m': 2, '5to10m': 3, '10to50m': 4, '50mplus': 5 }
export const BUSINESS_FLAGS = [
  { key: 'inventory', label: 'Involves inventory', points: 2 },
  { key: 'receivablesPayables', label: 'Significant receivables / payables', points: 1 },
  { key: 'complicatedAreas', label: 'Complicated accounting areas', points: 2 },
  { key: 'industryRules', label: 'Industry-specific requirements', points: 1 },
]
export const FIRST_YEAR_POINTS = 2
export const NEW_CLIENT_POINTS = 1
export const ISSUES_POINTS = (n) => (n >= 3 ? 2 : n >= 1 ? 1 : 0)
export const THRESHOLDS = { medium: 6, high: 11 } // Low below 6, Medium 6 to 10, High 11 and above
export const MAX_POINTS = 2 + 5 + 6 + 2 + 1 + 2

export const EXPERIENCE = [
  ['similarClients', 'Experience with similar clients'], ['auditType', 'Experience with this audit type'], ['industry', "Knowledge of the client's industry"],
  ['complicatedAreas', 'Experience with complicated audit areas'], ['technical', 'Sufficient technical knowledge'], ['sameClient', 'Previous experience with the same client'],
]
export const MIN_EXPERIENCE = { Low: 0, Medium: 3, High: 5 }
export const MAX_FILES = 14 // files at which a lead is treated as full (the existing capacity bands go red above 13)

export const emptyFactors = () => ({
  auditType: '', turnover: '', business: { inventory: false, receivablesPayables: false, complicatedAreas: false, industryRules: false, description: '' },
  firstYear: false, newClient: true, prevLead: '', prevMember: '', prevIssues: 0, prevIssuesNote: '',
})

export function classify(points) {
  return points >= THRESHOLDS.high ? 'High' : points >= THRESHOLDS.medium ? 'Medium' : 'Low'
}

export function scoreComplexity(f) {
  const lines = []
  const add = (factor, points, why) => lines.push({ factor, points, why })
  add('Audit type', AUDIT_TYPE_POINTS[f.auditType] ?? 0, f.auditType || 'not set')
  add('Turnover category', TURNOVER_POINTS[f.turnover] ?? 0, f.turnover ? f.turnover : 'not set')
  for (const b of BUSINESS_FLAGS) add(b.label, f.business?.[b.key] ? b.points : 0, f.business?.[b.key] ? 'yes' : 'no')
  add('First-year audit', f.firstYear ? FIRST_YEAR_POINTS : 0, f.firstYear ? 'first year' : 'recurring')
  add('New client', f.newClient ? NEW_CLIENT_POINTS : 0, f.newClient ? 'new client' : 'existing client')
  add('Previous-year issues', ISSUES_POINTS(Number(f.prevIssues) || 0), `${Number(f.prevIssues) || 0} issue(s)`)
  const points = lines.reduce((n, l) => n + l.points, 0)
  const missing = []
  if (!f.auditType) missing.push('audit type')
  if (!f.turnover) missing.push('turnover category')
  return { points, complexity: classify(points), lines, missing }
}

export const effectiveComplexity = (score, override) => (override?.value && String(override.reason || '').trim() ? override.value : score.complexity)

// candidate = { name, seniority, files, highComplexityFiles, dueSoon, reviewDuties, onLeave, experience: {key: bool} }
export function rankCandidates({ complexity, candidates, prevNames = [] }) {
  const need = MIN_EXPERIENCE[complexity]
  const prev = prevNames.filter(Boolean).map((n) => n.toLowerCase())
  const rows = candidates.map((c) => {
    const exp = EXPERIENCE.filter(([k]) => c.experience?.[k]).length
    const load = (c.files || 0) + 2 * (c.highComplexityFiles || 0) + (c.dueSoon || 0) + (c.reviewDuties || 0)
    const capacity = Math.max(0, MAX_FILES * 2 - load) // spare capacity in load points
    const continuity = prev.includes(String(c.name).toLowerCase())
    const notes = []
    let eligible = true
    if (c.onLeave) { eligible = false; notes.push('Not available (leave).') }
    if (exp < need) { notes.push(`Experience ${exp}/6 is below the ${need} expected for ${complexity} complexity.`); if (complexity === 'High') eligible = false }
    if ((c.files || 0) >= MAX_FILES) { notes.push(`Already carries ${c.files} files.`) }
    if (continuity) notes.push('Worked on this client last year (continuity).')
    if (complexity === 'Low' && exp > 4 && capacity < 14) notes.push('Experienced lead; consider keeping capacity for harder files.')
    // Low files go to whoever has capacity, hard files to the most experienced; continuity is a bonus where possible.
    const score = (complexity === 'Low' ? capacity * 1.2 + exp * 0.4 : complexity === 'Medium' ? capacity * 0.8 + exp * 2.5 : capacity * 0.4 + exp * 4) + (continuity && !c.onLeave ? 8 : 0) - (exp < need ? 6 : 0) - ((c.files || 0) >= MAX_FILES ? 8 : 0)
    return { ...c, exp, load, capacity, continuity, eligible, notes, score: Math.round(score * 10) / 10 }
  })
  return rows.sort((a, b) => (Number(b.eligible) - Number(a.eligible)) || (b.score - a.score) || a.name.localeCompare(b.name))
}

export const CHECKLIST = [
  ['auditType', 'Audit type identified'], ['turnover', 'Turnover category identified'], ['business', 'Nature of business understood'],
  ['firstYear', 'First-year / recurring status confirmed'], ['newClient', 'New / existing client status confirmed'], ['prevTeam', 'Previous-year team availability checked'],
  ['prevIssues', 'Previous-year issues considered'], ['experience', "Team member's experience considered"], ['workload', 'Current workload reviewed'],
  ['deadlines', 'Deadline and availability considered'], ['match', 'File complexity matched with team capability'],
]
export const checklistComplete = (c = {}) => CHECKLIST.every(([k]) => c[k] === true)
export const checklistMissing = (c = {}) => CHECKLIST.filter(([k]) => c[k] !== true).map(([, l]) => l)

// What the allocation still needs before it can be confirmed.
export function allocationProblems({ factors, score, lead, checklist, override }) {
  const p = []
  if (score.missing.length) p.push(`Set the ${score.missing.join(' and ')}.`)
  if (override?.value && !String(override.reason || '').trim()) p.push('A complexity override needs a reason.')
  if (!lead) p.push('Choose the lead.')
  if (!checklistComplete(checklist)) p.push(`Tick every item in the final review (${checklistMissing(checklist).length} left).`)
  if (!factors.newClient && !factors.prevLead && !factors.prevMember) p.push('For an existing client, record the previous-year team member or lead (or say none is available).')
  return p
}
