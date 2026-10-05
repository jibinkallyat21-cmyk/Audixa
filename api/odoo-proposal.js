// Creates a proposal (quotation) in Odoo and returns its PDF to the platform.
// Credentials stay on the server. Set these Vercel environment variables:
//   ODOO_URL      e.g. https://yourcompany.odoo.com   (no trailing slash)
//   ODOO_DB       database name
//   ODOO_USER     login (email) of an Odoo user allowed to create quotations
//   ODOO_API_KEY  API key for that user (Odoo > Preferences > Account Security)
//   ODOO_PRODUCT_ID (optional) product.product id used for proposal lines
//   ALLOWED_ORIGIN  (optional) e.g. https://audixa-ruby.vercel.app
// Without the Odoo variables the endpoint returns a clearly labelled demo document.
import { buildProposalPdf, bytesToBase64 } from '../src/utils/simplePdf.js'

const AUDITORS = ['ABCPA', 'MISCPA']
const AUDIT_TYPES = ['Proper Audit', 'Disclaimer of Opinion', 'Special Purpose Audit', 'Liquidation Audit', 'Agreed-Upon Procedures']

const clean = (v, max) => String(v ?? '').trim().slice(0, max)

function validate(b = {}) {
  const input = {
    client: clean(b.client, 120),
    contactName: clean(b.contactName, 80),
    contactEmail: clean(b.contactEmail, 120),
    crNumber: clean(b.crNumber, 30),
    city: clean(b.city, 60),
    auditor: clean(b.auditor, 20),
    auditType: clean(b.auditType, 40),
    preparedBy: clean(b.preparedBy, 80) || 'Front Office',
    lines: [],
  }
  if (!input.client) return { error: 'Client name is required' }
  if (!input.contactName) return { error: 'Contact name is required' }
  if (!/^\S+@\S+\.\S+$/.test(input.contactEmail)) return { error: 'A valid contact email is required' }
  if (!AUDITORS.includes(input.auditor)) return { error: 'Select a valid auditor' }
  if (!AUDIT_TYPES.includes(input.auditType)) return { error: 'Select a valid audit type' }
  const lines = Array.isArray(b.lines) ? b.lines.slice(0, 6) : []
  for (const l of lines) {
    const amount = Number(l?.amount)
    if (!clean(l?.name, 120) || !(amount > 0) || amount >= 1e9) return { error: 'Each fee line needs a name and a positive amount' }
    input.lines.push({ name: clean(l.name, 120), amount: Math.round(amount * 100) / 100 })
  }
  if (input.lines.length === 0) return { error: 'At least one fee line is required' }
  return { input }
}

const isoDate = (d) => d.toISOString().slice(0, 10)
const longDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

async function timedFetch(url, opts = {}, ms = 20000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try { return await fetch(url, { ...opts, signal: ctl.signal }) } finally { clearTimeout(t) }
}

async function odooProposal(cfg, input) {
  const rpc = async (service, method, args) => {
    const r = await timedFetch(`${cfg.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { service, method, args }, id: Date.now() }),
    })
    const j = await r.json()
    if (j.error) throw new Error(j.error.data?.message || j.error.message || 'Odoo error')
    return j.result
  }
  const uid = await rpc('common', 'authenticate', [cfg.db, cfg.user, cfg.key, {}])
  if (!uid) throw new Error('Odoo authentication failed - check ODOO_DB, ODOO_USER and ODOO_API_KEY')
  const call = (model, method, args, kwargs = {}) => rpc('object', 'execute_kw', [cfg.db, uid, cfg.key, model, method, args, kwargs])

  let [partnerId] = await call('res.partner', 'search', [[['name', '=', input.client], ['is_company', '=', true]]], { limit: 1 })
  if (!partnerId) {
    partnerId = await call('res.partner', 'create', [{
      name: input.client, is_company: true, email: input.contactEmail,
      city: input.city || false, company_registry: input.crNumber || false,
    }])
  }

  let productId = Number(cfg.productId) || 0
  if (!productId) {
    ;[productId] = await call('product.product', 'search', [[['name', '=', 'Audit Services']]], { limit: 1 })
    if (!productId) productId = await call('product.product', 'create', [{ name: 'Audit Services', sale_ok: true, list_price: 0 }])
  }

  const expiry = new Date(Date.now() + 30 * 864e5)
  const orderId = await call('sale.order', 'create', [{
    partner_id: partnerId,
    validity_date: isoDate(expiry),
    note: `Attention: ${input.contactName} (${input.contactEmail})\nAuditor: ${input.auditor}\nAudit type: ${input.auditType}\nPrepared by: ${input.preparedBy}`,
    order_line: input.lines.map((l) => [0, 0, { product_id: productId, name: l.name, product_uom_qty: 1, price_unit: l.amount }]),
  }])
  const [order] = await call('sale.order', 'read', [[orderId], ['name', 'amount_total']])

  const out = {
    ok: true, source: 'odoo', reference: order.name, odooId: orderId, total: order.amount_total,
    createdDate: longDate(new Date()), expiryDate: longDate(expiry),
  }
  try {
    const act = await call('sale.order', 'action_preview_sale_order', [[orderId]])
    const link = `${cfg.url}${act.url}`
    out.portalUrl = link
    const pdf = await timedFetch(`${link}${link.includes('?') ? '&' : '?'}report_type=pdf&download=true`, {}, 25000)
    if (pdf.ok && (pdf.headers.get('content-type') || '').includes('pdf')) {
      out.pdfBase64 = Buffer.from(await pdf.arrayBuffer()).toString('base64')
    } else {
      out.pdfError = `Odoo created ${order.name} but did not return a PDF (HTTP ${pdf.status})`
    }
  } catch (e) {
    out.pdfError = `Odoo created ${order.name} but the PDF could not be retrieved: ${e.message}`
  }
  return out
}

function demoProposal(input) {
  const now = new Date()
  const expiry = new Date(Date.now() + 30 * 864e5)
  const total = input.lines.reduce((s, l) => s + l.amount, 0)
  const doc = {
    reference: `PROP-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    ...input, total, createdDate: longDate(now), expiryDate: longDate(expiry),
  }
  return {
    ok: true, source: 'demo', reference: doc.reference, total, createdDate: doc.createdDate, expiryDate: doc.expiryDate,
    pdfBase64: bytesToBase64(buildProposalPdf(doc)),
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const allowed = process.env.ALLOWED_ORIGIN
  if (allowed && req.headers.origin && req.headers.origin !== allowed) return res.status(403).json({ ok: false, error: 'Origin not allowed' })

  const { input, error } = validate(req.body)
  if (error) return res.status(400).json({ ok: false, error })

  const cfg = {
    url: (process.env.ODOO_URL || '').replace(/\/+$/, ''), db: process.env.ODOO_DB,
    user: process.env.ODOO_USER, key: process.env.ODOO_API_KEY, productId: process.env.ODOO_PRODUCT_ID,
  }
  if (!cfg.url || !cfg.db || !cfg.user || !cfg.key) return res.status(200).json(demoProposal(input))

  try {
    return res.status(200).json(await odooProposal(cfg, input))
  } catch (e) {
    return res.status(502).json({ ok: false, error: `Odoo: ${e.name === 'AbortError' ? 'request timed out' : e.message}` })
  }
}
