// Second step of the opening balance check. The browser has already compared this year's opening balances with the previous year audited
// closing balances in code and sends only the flagged ledgers here. Claude proposes which previous year and this year ledgers are the same
// balance under a different name, code or grouping. The browser verifies every proposal by adding the amounts, so nothing here is trusted
// on its own and no amount is ever changed.
// Vercel environment variables: ANTHROPIC_API_KEY (without it the answer is {source:'unavailable'}), ANTHROPIC_MODEL (optional), ALLOWED_ORIGIN (optional).
import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5'
const MAX_FLAGS = 80

const SYSTEM = 'You help an audit team reconcile opening balances. You are given ledgers flagged as not agreeing between the previous year audited trial balance (PY, closing balance) and the current year trial balance (CY, opening balance). Names may differ in wording, language, spelling, coding or grouping, and one ledger may have been split or merged. Propose sets of PY ledgers and CY ledgers that are the same balance. Use the names exactly as given. Do not change, add or invent amounts or ledgers. If you are not confident that ledgers are the same balance, do not propose them.'

const schema = {
  type: 'object', additionalProperties: false, required: ['proposals', 'notes'],
  properties: {
    proposals: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['py', 'cy', 'reason'], properties: { py: { type: 'array', items: { type: 'string' } }, cy: { type: 'array', items: { type: 'string' } }, reason: { type: 'string' } } } },
    notes: { type: 'array', items: { type: 'string' } },
  },
}

function validate(b = {}) {
  const flags = Array.isArray(b.flags) ? b.flags : null
  if (!flags || !flags.length) return { error: 'No flagged ledgers' }
  if (flags.length > MAX_FLAGS) return { error: `Too many flagged ledgers (${flags.length}); review them manually` }
  const clean = flags.map((f) => ({ side: f?.side === 'PY' ? 'PY' : f?.side === 'CY' ? 'CY' : null, code: String(f?.code ?? '').slice(0, 40), name: String(f?.name ?? '').slice(0, 160), amount: Number(f?.amount), area: String(f?.area ?? '').slice(0, 80) }))
  if (clean.some((f) => !f.side || !f.name || !Number.isFinite(f.amount))) return { error: 'Invalid flagged ledger' }
  return { flags: clean }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const allowed = process.env.ALLOWED_ORIGIN
  if (allowed && req.headers.origin && req.headers.origin !== allowed) return res.status(403).json({ ok: false, error: 'Origin not allowed' })
  const { flags, error } = validate(req.body)
  if (error) return res.status(400).json({ ok: false, error })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(200).json({ ok: true, source: 'unavailable', reason: 'The AI review is not configured yet (no ANTHROPIC_API_KEY)' })
  try {
    const client = new Anthropic({ timeout: 55000, maxRetries: 1 })
    const response = await client.messages.create({
      model: MODEL, max_tokens: 3000, system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: `Flagged ledgers (JSON, amounts as debit positive / credit negative):\n${JSON.stringify(flags)}\n\nPropose the sets that are the same balance.` }],
    })
    if (response.stop_reason === 'refusal') return res.status(200).json({ ok: true, source: 'unavailable', reason: 'The AI review could not be done' })
    const text = response.content.find((b) => b.type === 'text')?.text
    if (response.stop_reason === 'max_tokens' || !text) return res.status(502).json({ ok: false, error: 'The review did not finish' })
    const out = JSON.parse(text)
    return res.status(200).json({ ok: true, source: 'claude', proposals: out.proposals, notes: out.notes })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(502).json({ ok: false, error: 'Claude API key was rejected' })
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ ok: false, error: 'Claude is busy, try again shortly' })
    if (e instanceof Anthropic.APIError) return res.status(502).json({ ok: false, error: `Claude API error ${e.status}` })
    return res.status(502).json({ ok: false, error: `Review failed: ${e.name === 'AbortError' ? 'request timed out' : e.message}` })
  }
}
