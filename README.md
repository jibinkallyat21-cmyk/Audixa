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
| `ODOO_PRODUCT_ID` | Optional. `product.product` id used for proposal lines (default: an "Audit Services" product is found/created) |
| `ALLOWED_ORIGIN` | Optional. Only accept requests from this origin, e.g. `https://audixa-ruby.vercel.app` |

Without the Odoo variables the endpoint returns a clearly labelled **demo document** instead, so the flow can
still be shown. The PDF is fetched through the quotation's customer-portal link, so the portal/Sales app must
be installed in Odoo. This uses Odoo's external JSON-RPC API (Odoo 14-18).
