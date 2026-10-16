import { amountMatching } from './openingReview.js'

// Asks the server for the AI review of the flagged ledgers only. When the AI is not available the amount-matching fallback is used and labelled as such.
export async function requestReview(flags) {
  try {
    const r = await fetch('/api/opening-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(65000), body: JSON.stringify({ flags }) })
    if (!(r.headers.get('content-type') || '').includes('application/json')) throw new Error('not available')
    const d = await r.json()
    if (d.ok && d.source === 'claude') return { source: 'ai', proposals: d.proposals, notes: d.notes || [] }
    return { source: 'fallback', proposals: amountMatching(flags), notes: [], reason: d.reason || d.error || 'The AI review is not available' }
  } catch {
    return { source: 'fallback', proposals: amountMatching(flags), notes: [], reason: 'The AI review could not be reached' }
  }
}
