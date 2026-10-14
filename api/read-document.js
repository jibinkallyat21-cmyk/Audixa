// Reads a client document (proposal, CR, AOA, MISA closure letter, Ministry letter) with Claude and
// returns the fields the Audit360 Rule Book needs. Nothing is invented: a value Claude cannot find is
// returned as null and the user fills it in by hand.
// Vercel environment variables:
//   ANTHROPIC_API_KEY  Claude API key. Without it this endpoint answers {source:'unavailable'} and the
//                      screen falls back to manual entry.
//   ANTHROPIC_MODEL    (optional) model id, default claude-opus-5-5
//   ALLOWED_ORIGIN     (optional) only accept requests from this origin
import Anthropic from '@anthropic-ai/sdk'

const MAX_BASE64 = 4 * 1024 * 1024 // Vercel functions accept ~4.5 MB request bodies
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5'

const str = { type: ['string', 'null'] }
const bool = { type: 'boolean' }
const numOrNull = { type: ['number', 'null'] }
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
const notes = { type: 'array', items: { type: 'string' } }

const intOrNull = { type: ['integer', 'null'] }
const nullableBool = { type: ['boolean', 'null'] }

const arr = (item) => ({ type: 'array', items: item })
const REF = { type: ['string', 'null'] }

const DOCS = {
  proposal: {
    describe: 'a signed or unsigned audit engagement proposal',
    fields: 'companyName (English); auditType (one of: Proper Audit, Disclaimer Audit, Liquidation Audit, Special Audit, Agreed-Upon Procedures); yearEnd (the financial year-end date in the proposal\'s year-end column, ISO yyyy-mm-dd); revenue (client revenue as a number); signed (true if the proposal carries a signature); auditFee (audit fee as a number, excluding VAT); auditFeeUnclear (true if the audit fee cannot be told apart from other fees); translationOpted and translationFee; zakatOpted and zakatFee (Zakat filing); accountsOpted and accountsFee (account finalisation). All fees are amounts excluding VAT; return null for any fee not stated.',
    schema: obj({
      companyName: str, auditType: str, yearEnd: str, revenue: numOrNull, signed: bool,
      auditFee: numOrNull, auditFeeUnclear: bool,
      translationOpted: bool, translationFee: numOrNull, zakatOpted: bool, zakatFee: numOrNull, accountsOpted: bool, accountsFee: numOrNull,
      notes,
    }),
  },
  cr: {
    describe: 'a Saudi Commercial Registration (CR) certificate',
    fields: 'companyName (English; if the CR shows only Arabic, give your English translation); entityType exactly as the CR states it (for example "Limited Liability Company (LLC)" or "Establishment"); crNumber; startDate (CR issue / start date, ISO yyyy-mm-dd; convert Hijri dates to Gregorian).',
    schema: obj({ companyName: str, entityType: str, crNumber: str, startDate: str, notes }),
  },
  aoa: {
    describe: 'Articles of Association (AOA) of a Saudi company',
    fields: 'companyName (English; translate if only Arabic); capital exactly as written in the document including currency (for example "SR 500,000"); yearEndDay and yearEndMonth (numbers) of the financial year-end; startsFromCR (true if the AOA says the first financial year runs from the CR date instead of giving a start date).',
    schema: obj({ companyName: str, capital: str, yearEndDay: numOrNull, yearEndMonth: numOrNull, startsFromCR: bool, notes }),
  },
  elReceived: {
    describe: 'an engagement letter (EL) issued by an audit firm to its client',
    fields: 'companyName (the client named in the EL, English); periodStart and periodEnd (the audit period, ISO yyyy-mm-dd); auditFee and translationFee (as numbers, EXCLUDING VAT; null when not shown in the EL; do not report Zakat or account finalisation fees); feesIncludeVat (true if the EL states its fees include VAT); auditorName (the audit firm named as the auditor, exactly as written); letterheadPresent (true if the EL is printed on a firm letterhead with logo, address or contact details, false if it is plain, null if you cannot tell); letterheadFirmName (the firm name shown in the letterhead, if any); and for companyName, period, fees, auditorName and letterhead the page number (companyNamePage, periodPage, feePage, auditorPage, letterheadPage) where each was found. Do not judge signatures or stamps.',
    schema: obj({
      companyName: str, periodStart: str, periodEnd: str,
      auditFee: numOrNull, translationFee: numOrNull, feesIncludeVat: bool,
      auditorName: str, letterheadPresent: nullableBool, letterheadFirmName: str,
      companyNamePage: intOrNull, periodPage: intOrNull, feePage: intOrNull, auditorPage: intOrNull, letterheadPage: intOrNull,
      notes,
    }),
  },
  aoaReview: {
    describe: 'Articles of Association (AOA) of a company in Saudi Arabia; translate any Arabic content into English',
    fields: 'companyName (English); crNumber if shown; capital exactly as written with currency, and capitalAmount as a number; registeredAddress; the financial year: fiscalYearStartDay/Month and fiscalYearEndDay/Month (numbers) with fiscalYearRef (clause or page), and whether the FIRST financial year differs in length from the standard one (firstYearDiffers, with firstYearNote); every shareholder/partner as shareholders[] with name, nationality (for a corporate shareholder leave nationality null and give countryOfIncorporation), shares (number), percent (number), isCorporate (true for a company), and ref (clause or page); managers[] (names) with managersRef; and amendmentHeaderNumber: the number shown in the HEADER of page 1 of the AOA (1 means never amended, 2 or more means amended), with amendmentRef. Quote the clause or page for each finding.',
    schema: obj({
      companyName: str, crNumber: str, capital: str, capitalAmount: numOrNull, registeredAddress: str,
      fiscalYearStartDay: intOrNull, fiscalYearStartMonth: intOrNull, fiscalYearEndDay: intOrNull, fiscalYearEndMonth: intOrNull, fiscalYearRef: str,
      firstYearDiffers: nullableBool, firstYearNote: str,
      shareholders: arr(obj({ name: str, nationality: str, countryOfIncorporation: str, shares: numOrNull, percent: numOrNull, isCorporate: bool, ref: REF })),
      managers: arr(obj({ name: str })), managersRef: str, amendmentHeaderNumber: intOrNull, amendmentRef: str,
      notes,
    }),
  },
  misaReview: {
    describe: 'a MISA (Ministry of Investment) license; translate any Arabic content into English',
    fields: 'licenseNumber; licenseType (for example services or trade); issueDate and expiryDate in Gregorian ISO yyyy-mm-dd, with issueDateHijri and expiryDateHijri as written when shown; status (Active, Expired, Suspended) if shown; companyNameEn and companyNameAr as shown; unifiedNumber; capitalAmount (number) and currency; shareholders[] with name, nationality and percent (ownership) if shown; ref (page).',
    schema: obj({
      licenseNumber: str, licenseType: str, issueDate: str, issueDateHijri: str, expiryDate: str, expiryDateHijri: str, status: str,
      companyNameEn: str, companyNameAr: str, unifiedNumber: str, capitalAmount: numOrNull, currency: str,
      shareholders: arr(obj({ name: str, nationality: str, percent: numOrNull })), ref: REF,
      notes,
    }),
  },
  vatReview: {
    describe: 'a VAT registration certificate (Saudi Arabia)',
    fields: 'companyName as shown; crNumber (Commercial Registration number); address; taxFrequency (monthly or quarterly) and taxPeriodText (the period stated); trn (VAT registration number exactly as printed); effectiveDate (effective registration date, ISO yyyy-mm-dd); hasBranches (true if the certificate lists branches, false if it lists none, null if unclear) and branches[] with name, crNumber, licenseNumber, contractNumber and address. If a field is not visible or unclear return null; never guess.',
    schema: obj({
      companyName: str, crNumber: str, address: str, taxFrequency: str, taxPeriodText: str, trn: str, effectiveDate: str, hasBranches: nullableBool,
      branches: arr(obj({ name: str, crNumber: str, licenseNumber: str, contractNumber: str, address: str })),
      notes,
    }),
  },
  elBasic: {
    describe: 'a signed engagement letter (EL) from an audit firm; check it page by page',
    fields: 'companyName (the client, English); auditPeriodStart and auditPeriodEnd (ISO yyyy-mm-dd); totalPages and pages[]: for EVERY page its number, whether a company seal is visible on it (seal) and whether an authorised signature is visible on it (signature): true, false, or null if you cannot tell; auditFee (number), currency, and vatIncluded (true if the fee includes VAT, false if it excludes VAT, null if not stated). Never judge whether a signature is genuine.',
    schema: obj({
      companyName: str, auditPeriodStart: str, auditPeriodEnd: str, totalPages: intOrNull,
      pages: arr(obj({ page: { type: 'integer' }, seal: nullableBool, signature: nullableBool })),
      auditFee: numOrNull, currency: str, vatIncluded: nullableBool,
      notes,
    }),
  },
  contributorPdf: {
    describe: 'a GOSI Active or Inactive Contributors list in PDF form',
    fields: 'contributors[]: for every row its employeeId (exactly as printed, keep leading zeros) and name (exactly as printed). Names only: do not report wages or dates.',
    schema: obj({ contributors: arr(obj({ employeeId: str, name: str })), notes }),
  },
  signedEL: {
    describe: 'a signed engagement letter (EL) returned by the client, with company stamps and signatures',
    fields: 'totalPages (number of pages in the EL); pagesWithStamp (list of page numbers that carry a company stamp or seal); lastPageStamp (true if the last page carries a company stamp, false if not, null if you cannot tell); lastPageSignature (true if a handwritten or digital signature is visible on the last page, false if none, null if you cannot tell or it is unclear); signedBy (the printed name of the signatory next to the signature, if shown); signatoryCapacity (the capacity stated, for example shareholder, manager, general manager of the parent company). Never decide whether the signature is genuine; only report what is visible.',
    schema: obj({
      totalPages: { type: ['integer', 'null'] }, pagesWithStamp: { type: 'array', items: { type: 'integer' } },
      lastPageStamp: nullableBool, lastPageSignature: nullableBool, signedBy: str, signatoryCapacity: str,
      notes,
    }),
  },
  misaClosure: {
    describe: 'a MISA (Ministry of Investment) closure letter for a company in liquidation',
    fields: 'date (the date of the letter, ISO yyyy-mm-dd; convert Hijri to Gregorian).',
    schema: obj({ date: str, notes }),
  },
  ministryLetter: {
    describe: 'a letter received from the Ministry for a company in liquidation',
    fields: 'date (the date of the letter, ISO yyyy-mm-dd; convert Hijri to Gregorian).',
    schema: obj({ date: str, notes }),
  },
}

const SYSTEM = 'You extract fields from audit client documents for an audit firm in Saudi Arabia. Return only what the document actually shows. If a value is missing, unreadable or ambiguous, return null (or false for yes/no fields) and add a short note saying why. Never guess, estimate or fill a value from general knowledge. Documents may be in Arabic; translate company names to English but keep numbers and dates exact.'

function validate(b = {}) {
  const docType = String(b.docType || '')
  if (!DOCS[docType]) return { error: 'Unknown document type' }
  const mediaType = String(b.mediaType || '')
  const data = typeof b.base64 === 'string' ? b.base64 : ''
  if (!data || data.length > MAX_BASE64 || /[^A-Za-z0-9+/=]/.test(data)) return { error: 'Invalid or oversized file (limit about 3 MB)' }
  if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mediaType)) {
    return { error: 'Only PDF or image files can be read automatically' }
  }
  return { input: { docType, mediaType, data, fileName: String(b.fileName || '').slice(0, 120) } }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const allowed = process.env.ALLOWED_ORIGIN
  if (allowed && req.headers.origin && req.headers.origin !== allowed) return res.status(403).json({ ok: false, error: 'Origin not allowed' })

  const { input, error } = validate(req.body)
  if (error) return res.status(400).json({ ok: false, error })
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ ok: true, source: 'unavailable', reason: 'Automatic reading is not configured yet (no ANTHROPIC_API_KEY)' })
  }

  const doc = DOCS[input.docType]
  const fileBlock = input.mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: input.data } }
    : { type: 'image', source: { type: 'base64', media_type: input.mediaType, data: input.data } }

  try {
    const client = new Anthropic({ timeout: 55000, maxRetries: 1 })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: doc.schema } },
      messages: [{
        role: 'user',
        content: [fileBlock, { type: 'text', text: `This is ${doc.describe}. Extract: ${doc.fields} Also list any ambiguity in "notes".` }],
      }],
    })
    if (response.stop_reason === 'refusal') return res.status(200).json({ ok: true, source: 'unavailable', reason: 'The document could not be read automatically' })
    const text = response.content.find((b) => b.type === 'text')?.text
    if (response.stop_reason === 'max_tokens' || !text) return res.status(502).json({ ok: false, error: 'Reading the document did not finish' })
    const { notes: found, ...fields } = JSON.parse(text)
    return res.status(200).json({ ok: true, source: 'claude', docType: input.docType, fields, notes: found || [] })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(502).json({ ok: false, error: 'Claude API key was rejected' })
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ ok: false, error: 'Claude is busy, try again shortly' })
    if (e instanceof Anthropic.APIError) return res.status(502).json({ ok: false, error: `Claude API error ${e.status}` })
    return res.status(502).json({ ok: false, error: `Reading failed: ${e.name === 'AbortError' ? 'request timed out' : e.message}` })
  }
}
