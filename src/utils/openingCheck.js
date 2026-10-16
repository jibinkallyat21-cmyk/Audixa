// Opening balances of the client's trial balance against the closing balances of the previous year audited trial balance.
// Wraps the process 3.3 comparison (by AFS line, with the retained earnings roll-forward). Pure function.
import { compareOpening } from './tbChecks.js'

export function openingCheck(pyLedgers, cyLedgers, tolerance = 1) {
  const r = compareOpening({ py: pyLedgers, cy: cyLedgers, tolerance })
  const lines = r.rows.map((x) => ({ label: x.label, pyClosing: x.pyTb, cyOpening: x.cyOpen, difference: x.diffTb, status: x.status === 'Difference' ? 'Difference' : 'OK', ledgers: x.ledgers.filter((l) => l.status !== 'OK') }))
  const reDiff = r.re.status === 'Difference'
  const differences = lines.filter((l) => l.status === 'Difference').length + (reDiff && !lines.some((l) => l.status === 'Difference' && /retained/i.test(l.label)) ? 1 : 0)
  const ledgerDiffs = lines.flatMap((l) => l.ledgers.filter((g) => g.status === 'Difference' || g.status === 'Missing in CY'))
  return { lines, re: r.re, differences, aligned: differences === 0, ledgerDiffs, plOpen: r.re.plOpen }
}
