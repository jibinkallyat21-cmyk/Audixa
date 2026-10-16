# Audixa (Audit 360)

Front-end platform for an audit firm (Analytix): a client portal, the audit execution team, the audit manager, front office and management.
React 19 + Vite, Tailwind, React Router, framer-motion, ExcelJS. There is no database or real login yet: data is kept in the browser
(`localStorage`, with an in-memory fallback) behind one module, `src/utils/store.js`, so a server can replace it by changing that file. Four
Vercel serverless functions live in `api/`.

## Run

```
npm install
npm run dev      # development
npm run build    # production build (always check the production build, not only dev)
npm test         # node --test "scripts/*.test.mjs": the rule logic (no browser needed)
npm run lint
```

## Demo data

Sign in through the demo picker on `/login`. The client portal and the execution team portal are empty until the client opens the
**Engagement Dashboard and presses "Load demo data"** (it can create an ABCPA or MISCPA client, existing or new). That adds the demo client
to the team's files, submits a demo trial balance, general ledger and (for a new client) previous year audited trial balance, and the whole
flow can then be followed in both portals. "Remove demo data" clears it. The manager, front office and management portals still use sample
data from `src/data/sampleData.js`.

## The client flow (what is built)

1. The client uploads the trial balance and the detailed general ledger (prescribed formats, checked on upload: `src/utils/tbFormat.js`,
   `src/utils/generalLedger.js`). Existing clients: the allocated team member adds last year's audited trial balance (PDF or Excel);
   new clients upload it themselves or say it is their first audit.
2. The audit team checks the opening balances against the previous year audited trial balance in two steps: code first
   (`src/utils/openingCheck.js`), then, only for flagged ledgers, the AI review (`api/opening-review.js`) whose proposals are verified by
   adding the amounts (`src/utils/openingReview.js`). The team confirms and approves.
3. Approval applies the party-wise balances from the general ledger, issues the requirement list for the allocated firm
   (`src/data/misRequirements.js`, `src/data/abcRequirements.js`, filtered by `src/utils/requirementsEngine.js`), and fills the working
   trial balance. The client then uploads documents and the team accepts or rejects them. Queries, activity log and adjustments follow.
4. The execution tools (TB review, sampling and vouching, payroll and assets, IFRS trial balance and financial statements, query tracker,
   audit log, archive) are under the team's My Workspace > Audit Procedures. Their logic is pure code in `src/utils/*.js` with tests in `scripts/`.

`docs/execution-decisions.md` is the running list of every decision taken and every open question. Read it before changing rules.

## AI (Claude) endpoints

Both are optional: without `ANTHROPIC_API_KEY` the screens fall back to manual entry or code-only matching and say so.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key (Vercel, secret) |
| `ANTHROPIC_MODEL` | Optional model id (default `claude-opus-5-5`) |
| `ALLOWED_ORIGIN` | Optional. Only accept requests from this origin |

- `api/read-document.js` reads uploaded PDFs/images (proposal, CR, AOA, engagement letter, previous year trial balance, intake documents).
- `api/opening-review.js` reviews only the ledgers the code check flagged in the opening balance comparison.

## Odoo proposal integration

Front Office > Proposals > **New Proposal** sends the form to `api/odoo-proposal.js`, a Vercel serverless
function. It creates the client (if new) and a quotation in Odoo, fetches the quotation PDF, and returns
both to the platform. Odoo credentials never reach the browser.

Set these in Vercel (Project > Settings > Environment Variables), then redeploy:

| Variable | Purpose |
| --- | --- |
| `ODOO_URL` | Odoo base URL, e.g. `https://yourcompany.odoo.com` (no trailing slash) |
| `ODOO_DB` | Odoo database name |
| `ODOO_USER` | Login (email) of an Odoo user who can create quotations |
| `ODOO_API_KEY` | API key for that user (Odoo > Preferences > Account Security) |
| `ODOO_GATEWAY_TOKEN` | Optional. Secret sent as the `x-audixa-gateway` header (name via `ODOO_GATEWAY_HEADER`). Use with a Cloudflare/firewall rule that lets requests carrying this header reach `/jsonrpc` and `/my/orders/` without a bot challenge |
| `ODOO_PRODUCT_ID` | Optional. `product.product` id used for proposal lines (default: an "Audit Services" product is found/created) |
| `ALLOWED_ORIGIN` | Optional. Only accept requests from this origin, e.g. `https://audixa-ruby.vercel.app` |

Without the Odoo variables the endpoint returns a clearly labelled **demo document** instead, so the flow can
still be shown. The PDF is fetched through the quotation's customer-portal link, so the portal/Sales app must
be installed in Odoo. This uses Odoo's external JSON-RPC API (Odoo 14-18).

## Email (Microsoft 365 / Graph)

"Approve & Send" on a generated proposal calls `api/send-proposal-email.js`, which emails the client contact
the proposal (PDF attached) from a Microsoft 365 mailbox via the Microsoft Graph API. Set in Vercel:

| Variable | Purpose |
| --- | --- |
| `MS_TENANT_ID` | Azure Directory (tenant) ID |
| `MS_CLIENT_ID` | Azure Application (client) ID |
| `MS_CLIENT_SECRET` | Client secret **value** (App registration > Certificates & secrets) |
| `MAIL_SENDER` | Mailbox the email is sent from |
| `ALLOWED_ORIGIN` | Optional. Only accept requests from this origin |

In Azure, add the Microsoft Graph **application** permission `Mail.Send` and grant admin consent. Consider an
Exchange application access policy so the app can only send as `MAIL_SENDER`. Subject and body are built on the
server from the proposal fields. Until these are set, "Approve & Send" marks the proposal as sent and says that
nothing was emailed.

## Go-live checklist (Odoo + email)

Do these from company systems. Until then the app runs in demo mode (labelled demo documents; "Approve & Send" says nothing was emailed).

1. **Hosting.** Import this repo into the company Vercel account (or keep the current project) and deploy `main`.
2. **Odoo access from Vercel.** If Odoo sits behind Cloudflare, ask the Cloudflare owner for a WAF custom rule on the Odoo hostname: when the path starts with `/jsonrpc` or `/my/orders/` **and** header `x-audixa-gateway` equals the secret, then *Skip* bot/security checks (on the Free plan, Bot Fight Mode cannot be skipped by a rule). Put the same secret in `ODOO_GATEWAY_TOKEN`.
3. **Vercel variables.** Set `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY`, `ODOO_GATEWAY_TOKEN` (if used) and the `MS_*` / `MAIL_SENDER` variables, then redeploy. Mark keys and secrets as *Secret*. Set `ALLOWED_ORIGIN` to the production URL.
4. **Azure app.** Add the Microsoft Graph application permission `Mail.Send` with admin consent, create a client secret, and (recommended) restrict the app to the sender mailbox with an Exchange application access policy.
5. **Rotate keys.** Create fresh Odoo and Azure credentials for production; do not reuse any that were shared in chat or tests.
6. **Odoo tidy-up.** The quotation PDF header shows the Odoo company name; set it to the correct legal name. The "Audit Services" product is created automatically, or set `ODOO_PRODUCT_ID`. Delete test quotations and the "AUDIXA Integration Test Co" client.
7. **Check.** Generate one proposal from Front Office (expect "Generated by Odoo" and a reference like `S0000x`), then Approve & Send to your own address.

Note: the app has no real login or backend. Portal access is enforced in the browser only and the two `/api` endpoints are unauthenticated apart from `ALLOWED_ORIGIN`, so add real authentication before handling production data.
