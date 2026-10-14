// Emails a proposal (with its PDF attached) to the client contact through Microsoft Graph,
// using an Azure app registration (client-credentials flow). Secrets stay on the server.
// Vercel environment variables:
//   MS_TENANT_ID      Directory (tenant) ID
//   MS_CLIENT_ID      Application (client) ID
//   MS_CLIENT_SECRET  Client secret VALUE (Azure > App registration > Certificates & secrets)
//   MAIL_SENDER       Mailbox the email is sent from, e.g. test.hacktix@analytix.org
//   ALLOWED_ORIGIN    (optional) only accept requests from this origin
// The Azure app needs the Microsoft Graph *application* permission Mail.Send with admin consent.
// The subject and body are built here from structured fields, so this endpoint cannot be used
// to send arbitrary content.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const clean = (v, max) => String(v ?? '').trim().slice(0, max)
const MAX_PDF_BASE64 = 3 * 1024 * 1024

function validate(b = {}) {
  const input = {
    to: clean(b.to, 120), contactName: clean(b.contactName, 80), client: clean(b.client, 120),
    reference: clean(b.reference, 40), auditor: clean(b.auditor, 20), auditType: clean(b.auditType, 40),
    fee: Number(b.fee), expiryDate: clean(b.expiryDate, 30), preparedBy: clean(b.preparedBy, 80) || 'Front Office',
    pdfBase64: typeof b.pdfBase64 === 'string' ? b.pdfBase64 : '',
  }
  if (!/^\S+@\S+\.\S+$/.test(input.to)) return { error: 'A valid recipient email is required' }
  if (!input.client || !input.reference || !input.contactName) return { error: 'Client, contact and reference are required' }
  if (!(input.fee > 0)) return { error: 'A valid fee is required' }
  if (input.pdfBase64.length > MAX_PDF_BASE64 || /[^A-Za-z0-9+/=]/.test(input.pdfBase64)) return { error: 'Invalid or oversized PDF attachment' }
  return { input }
}

function buildMessage(i) {
  const fee = `SAR ${i.fee.toLocaleString('en-US')}`
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0D1B2A">
<p>Dear ${esc(i.contactName)},</p>
<p>Thank you for your interest. Please find attached our audit engagement proposal <strong>${esc(i.reference)}</strong> for <strong>${esc(i.client)}</strong>.</p>
<table style="border-collapse:collapse;margin:12px 0">
<tr><td style="padding:2px 16px 2px 0;color:#64748B">Audit type</td><td>${esc(i.auditType)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#64748B">Auditor</td><td>${esc(i.auditor)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#64748B">Proposed fee</td><td>${esc(fee)}</td></tr>
${i.expiryDate ? `<tr><td style="padding:2px 16px 2px 0;color:#64748B">Valid until</td><td>${esc(i.expiryDate)}</td></tr>` : ''}
</table>
<p>Please review the proposal and reply to this email with any questions.</p>
<p>Kind regards,<br>${esc(i.preparedBy)}<br>Analytix</p></div>`
  const message = {
    subject: `Audit engagement proposal ${i.reference} - ${i.client}`,
    body: { contentType: 'HTML', content: html },
    toRecipients: [{ emailAddress: { address: i.to } }],
  }
  if (i.pdfBase64) {
    message.attachments = [{
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: `${i.reference.replace(/[^A-Za-z0-9._-]/g, '_')}.pdf`,
      contentType: 'application/pdf', contentBytes: i.pdfBase64,
    }]
  }
  return message
}

async function timedFetch(url, opts, ms = 20000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try { return await fetch(url, { ...opts, signal: ctl.signal }) } finally { clearTimeout(t) }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const allowed = process.env.ALLOWED_ORIGIN
  if (allowed && req.headers.origin && req.headers.origin !== allowed) return res.status(403).json({ ok: false, error: 'Origin not allowed' })

  const { input, error } = validate(req.body)
  if (error) return res.status(400).json({ ok: false, error })

  const { MS_TENANT_ID: tenant, MS_CLIENT_ID: clientId, MS_CLIENT_SECRET: secret, MAIL_SENDER: sender } = process.env
  if (!tenant || !clientId || !secret || !sender) {
    return res.status(200).json({ ok: true, delivered: false, reason: 'Email sending is not configured yet' })
  }

  try {
    const tokenRes = await timedFetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: secret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
    })
    const token = await tokenRes.json()
    if (!tokenRes.ok || !token.access_token) throw new Error(token.error_description ? token.error_description.split('\r')[0] : 'Microsoft sign-in failed')

    const send = await timedFetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: buildMessage(input), saveToSentItems: true }),
    })
    if (send.status !== 202) {
      let detail = ''
      try { detail = (await send.json())?.error?.message || '' } catch {}
      throw new Error(detail || `Microsoft Graph returned HTTP ${send.status}`)
    }
    return res.status(200).json({ ok: true, delivered: true, to: input.to })
  } catch (e) {
    return res.status(502).json({ ok: false, error: `Email: ${e.name === 'AbortError' ? 'request timed out' : e.message}` })
  }
}
