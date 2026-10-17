// Second step of the opening balance check. The browser has already compared this year's opening balances with the previous year audited
// closing balances in code and sends only the flagged ledgers here. Claude proposes which previous year and this year ledgers are the same
// balance under a different name, code or grouping. The browser verifies every proposal by adding the amounts, so nothing here is trusted
// on its own and no amount is ever changed.
// Vercel environment variables: OPENROUTER_API_KEY (free models, dummy data only) or ANTHROPIC_API_KEY (see _ai.js); without either the answer is {source:'unavailable'}. ALLOWED_ORIGIN (optional).
import { askJson } from './_ai.js'

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
  const r = await askJson({ system: SYSTEM, user: `Flagged ledgers (JSON, amounts as debit positive / credit negative):\n${JSON.stringify(flags)}\n\nPropose the sets that are the same balance.`, schema, maxTokens: 3000 })
  if (r.unavailable) return res.status(200).json({ ok: true, source: 'unavailable', reason: r.reason })
  if (!r.ok) return res.status(r.status === 200 ? 200 : r.status).json(r.status === 200 ? { ok: true, source: 'unavailable', reason: r.reason } : { ok: false, error: r.reason })
  const proposals = Array.isArray(r.data?.proposals) ? r.data.proposals.filter((p) => Array.isArray(p?.py) && Array.isArray(p?.cy)).map((p) => ({ py: p.py.map(String), cy: p.cy.map(String), reason: String(p.reason || '') })) : []
  return res.status(200).json({ ok: true, source: 'ai', engine: r.engine, proposals, notes: Array.isArray(r.data?.notes) ? r.data.notes.map(String) : [] })
}
