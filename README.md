# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

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
