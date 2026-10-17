import { toRequest } from './ledgerReview.js'

// Asks the server for a suggested group for each unplaced ledger. Without the AI the ledgers simply stay unplaced for a person to choose.
export async function requestPlacement(ledgers) {
  const list = toRequest(ledgers)
  if (!list.length) return { source: 'none', items: [], reason: '' }
  try {
    const r = await fetch('/api/classify-ledgers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(65000), body: JSON.stringify({ ledgers: list }) })
    if (!(r.headers.get('content-type') || '').includes('application/json')) throw new Error('not available')
    const d = await r.json()
    if (d.ok && d.source === 'ai') return { source: 'ai', items: d.items || [], engine: d.engine || '', reason: '' }
    return { source: 'unavailable', items: [], reason: d.reason || d.error || 'The AI is not available' }
  } catch { return { source: 'unavailable', items: [], reason: 'The AI could not be reached' } }
}
