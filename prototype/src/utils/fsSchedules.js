// The supporting schedules behind the IFRS financial statements (prepaid, depreciation, end of service, GOSI expense) worked out from the client's
// trial balance, and a check that each one agrees to the trial balance. A difference is flagged with the team member who prepared that schedule.
// Pure functions. For the demo client the schedule lines come from its own trial balance, as in the schedule tools.
import { prepaidSchedule, depSchedule, r2 } from './prepaidDep.js'
import { clientPrepaid, clientAssets, clientGosi, clientEosbStaff } from './clientPayrollData.js'
import { gosiSheet, eosbRow } from './salary.js'

const sum = (ledgers, test, key = 'closing') => r2(ledgers.filter(test).reduce((n, l) => n + (Number(l[key]) || 0), 0))
export const SCHEDULE_AREAS = { prepaid: 'Prepaid expenses', depreciation: 'Depreciation', eosb: 'GOSI and EOSB', gosi: 'GOSI and EOSB' }

export function buildSchedules(ledgers, { yearStart = '2025-01-01', yearEnd = '2025-12-31' } = {}) {
  const prepaidItems = clientPrepaid(ledgers); const prepaid = prepaidSchedule(prepaidItems, yearEnd)
  const assets = clientAssets(ledgers); const dep = depSchedule(assets, yearEnd, { yearStart })
  const staff = clientEosbStaff(ledgers).map((e) => ({ ...e, ...eosbRow({ salary: e.basic + e.housing, joining: e.joining, leaving: e.leaving, yearEnd, opening: e.opening }) }))
  const eosbTotals = { opening: r2(staff.reduce((n, e) => n + (e.opening || 0), 0)), closing: r2(staff.reduce((n, e) => n + (e.closing || 0), 0)), charge: r2(staff.reduce((n, e) => n + (e.charge || 0), 0)) }
  const g = clientGosi(ledgers); const gosi = gosiSheet(g.bill, g.mud)
  const tb = {
    prepaid: sum(ledgers, (l) => l.group === 'prepayments'),
    cost: sum(ledgers, (l) => l.group === 'ppeCost'), accDep: Math.abs(sum(ledgers, (l) => l.group === 'accDep')), depExpense: sum(ledgers, (l) => l.group === 'opex' && /deprec/i.test(l.name)),
    eosb: Math.abs(sum(ledgers, (l) => l.group === 'eosb')), gosiExpense: sum(ledgers, (l) => l.group === 'opex' && /gosi|social insurance/i.test(l.name)),
  }
  const checks = []
  const add = (id, area, label, schedule, tbFigure) => checks.push({ id, area, label, schedule: r2(schedule), tb: r2(tbFigure), diff: r2(schedule - tbFigure), ok: Math.abs(schedule - tbFigure) < 0.01 })
  add('prepaid', 'prepaid', 'Prepaid expenses: unexpired amount at the year end', prepaid.totals.prepaid, tb.prepaid)
  add('cost', 'depreciation', 'Fixed assets: closing cost', dep.totals.G, tb.cost)
  add('accdep', 'depreciation', 'Fixed assets: closing accumulated depreciation', dep.totals.K, tb.accDep)
  if (tb.depExpense) add('depexp', 'depreciation', 'Depreciation charge for the year', dep.totals.I, tb.depExpense)
  add('eosb', 'eosb', 'End of service benefits: provision at the year end', eosbTotals.closing, tb.eosb)
  if (tb.gosiExpense) add('gosi', 'gosi', 'GOSI expense for the year', gosi.expenseTotal, tb.gosiExpense)
  return { prepaidItems, prepaid, assets, dep, staff, eosbTotals, gosi, tb, checks, mismatches: checks.filter((c) => !c.ok) }
}

// Who prepared a schedule: the person on the latest audit-log entry for that area, else the fallback (the file's associate).
export function scheduleOwner(area, log, clientName, fallback = '') {
  const e = (log || []).filter((x) => x.clientName === clientName && x.extra?.auditArea === SCHEDULE_AREAS[area] && x.extra?.performedBy).sort((a, b) => (a.at < b.at ? 1 : -1))[0]
  return e?.extra?.performedBy || fallback || 'Audit team'
}
