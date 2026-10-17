// Places trial balance ledgers the name rules could not place (different names, abbreviations, Arabic or mixed names) into a trial balance group.
// The browser sends only the unplaced ledger names and balances, checks the answer against the allowed groups, and a person accepts it line by line.
// No amount is ever changed. Environment: see _ai.js (OPENROUTER_API_KEY for free models with dummy data, or ANTHROPIC_API_KEY), ALLOWED_ORIGIN optional.
import { askJson } from './_ai.js'

const MAX = 80
const GROUPS = [
  ['cash', 'cash on hand, petty cash, bank accounts'], ['receivables', 'trade receivables, customers, accounts receivable'], ['prepayments', 'prepaid expenses, advances to suppliers, deposits, other receivables, staff advances'],
  ['inventory', 'stock, goods, materials'], ['ppeCost', 'property, plant and equipment at cost (furniture, vehicles, equipment, buildings)'], ['accDep', 'accumulated depreciation'], ['intangibles', 'software, licences, goodwill, intangible assets'],
  ['vat', 'VAT input or output, VAT payable or receivable'], ['payables', 'trade payables, suppliers, accounts payable'], ['accruals', 'accrued expenses, other payables, advances from customers, unearned revenue, provisions'],
  ['related', 'due to or from related parties, partners or shareholders, owner current accounts'], ['borrowings', 'loans, bank facilities, lease liabilities'], ['eosb', 'end of service benefits, employee benefit provision'],
  ['capital', 'share capital, partners capital'], ['reserves', 'statutory or other reserves'], ['re', 'retained earnings, accumulated profit or loss'], ['revenue', 'sales and service revenue'], ['cogs', 'cost of sales, purchases, direct costs'],
  ['opex', 'operating, administrative and selling expenses, salaries, rent, depreciation expense'], ['finance', 'interest and bank charges, finance cost'], ['otherIncome', 'other income, gains, commission received'], ['tax', 'zakat and income tax'],
]
const IDS = GROUPS.map((g) => g[0])
const SYSTEM = `You help an audit team place trial balance ledgers into groups. The company is in Saudi Arabia; names may be English, Arabic or mixed, abbreviated or misspelt. For each ledger choose the single best group id, or null when it genuinely cannot be told from the name and sign. Groups: ${GROUPS.map((g) => `${g[0]} (${g[1]})`).join('; ')}. Amounts are debit positive, credit negative; use the sign as a hint only. Give a short reason in plain English. Do not invent facts.`
const schema = {
  type: 'object', additionalProperties: false, required: ['items'],
  properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'group', 'reason'], properties: { name: { type: 'string' }, group: { type: ['string', 'null'], enum: [...IDS, null] }, reason: { type: 'string' } } } } },
}

function validate(b = {}) {
  const list = Array.isArray(b.ledgers) ? b.ledgers : null
  if (!list || !list.length) return { error: 'No ledgers' }
  if (list.length > MAX) return { error: `Too many ledgers (${list.length}); place them manually` }
  const clean = list.map((l) => ({ code: String(l?.code ?? '').slice(0, 40), name: String(l?.name ?? '').slice(0, 160), amount: Number(l?.amount) }))
  if (clean.some((l) => !l.name || !Number.isFinite(l.amount))) return { error: 'Invalid ledger' }
  return { ledgers: clean }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const allowed = process.env.ALLOWED_ORIGIN
  if (allowed && req.headers.origin && req.headers.origin !== allowed) return res.status(403).json({ ok: false, error: 'Origin not allowed' })
  const { ledgers, error } = validate(req.body)
  if (error) return res.status(400).json({ ok: false, error })
  const r = await askJson({ system: SYSTEM, user: `Ledgers to place (JSON):\n${JSON.stringify(ledgers)}\n\nReturn one item per ledger, using the exact ledger name.`, schema, maxTokens: 3000 })
  if (r.unavailable || r.status === 200) return res.status(200).json({ ok: true, source: 'unavailable', reason: r.reason })
  if (!r.ok) return res.status(r.status).json({ ok: false, error: r.reason })
  const items = Array.isArray(r.data?.items) ? r.data.items.map((i) => ({ name: String(i?.name ?? ''), group: IDS.includes(i?.group) ? i.group : null, reason: String(i?.reason ?? '') })) : []
  return res.status(200).json({ ok: true, source: 'ai', engine: r.engine, items })
}
