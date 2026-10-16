# Hand-over prompt for the company Claude Code

Open Claude Code in this folder (the one that contains `prototype/` and `project/`) and paste everything below the line. The prompt was written against the actual text of the skill `analytix-prd-to-app`. If a skill is updated later, the skill wins on process and this prompt wins on our business rules and on the look of the app.

---

Start now with the skill `analytix-prototype-to-prd` on `prototype/`, after reading this whole prompt.

You are building the real **Audixa (Audit 360)** application for Analytix, an audit firm that works for two audit firms, **ABCPA** and **MISCPA**. A working prototype is in `prototype/`. The real application is built in `project/` with the Analytix skills you have. It runs **locally only** (SQLite, no hosting service).

## 0. Ground rules

1. **`prototype/` is read only.** Never change it. It is the visual and workflow reference and it also holds the knowledge you need: `prototype/docs/execution-decisions.md` (52 numbered decisions and the open questions), `prototype/docs/source/` (the Rule Book `00_Audit360_Execution_Rule_Book.docx`, the requirement lists of both firms, the Phase 1 definition, the sampling documents and workbooks, the salary / IFRS / financial statement format files and `Audixa_Open_Items.xlsx`) and `prototype/README.md`.
2. **Do not invent audit rules.** The Rule Book and the decisions file are the source of truth. If something is missing or unclear, put it in the "Open questions" list for me and carry on with the rest. Do not guess a rule.
3. **The look of the app must not change.** See section 3.
4. **API keys, passwords and tokens never go into the chat.** When a feature needs one, follow the skill: tell me the variable name and where to get it, I put it into `project/backend/.env` myself and reply "done" or "later". Features with a missing key must still start and show "not set up".
5. Explain progress in plain English, as the skill says. Show me each stage's result and wait for my go-ahead where the skill says so.

## 1. Order of work

1. **`analytix-prototype-to-prd`** (the first step; it is not skipped). It builds `PRD.md` and `.prd_work/` from `prototype/`. Its Step 4 is mandatory: it will show you what it understood and ask me what to add. Do not answer for me. Show me its message; section 1A below holds my prepared answers, which I will paste or edit. It ends with me saying "approve the PRD", which sets the status to APPROVED and the version to 1.0.
2. **`analytix-recheck-prd`** is **not** a review step you run on your own. It is only for after I edit `PRD.md` by hand (for example to answer open questions): run it then, before building.
3. **`analytix-prd-to-app`**: builds in `project/` from the APPROVED PRD, following its phases and writing `project/docs/BUILD_PLAN.md`, `BUILD_PROGRESS.md`, `ASSUMPTIONS.md` and `CREDENTIALS_NEEDED.md`. Suggested module order: foundation and login, clients and allocation, the client onboarding flow (section 4), the execution tools tied to the client file, the other portals, integrations and AI. It can span several sessions: "continue the build" resumes it.
4. **`analytix-app-testing`**, then **`analytix-fix-bugs`**, then **`analytix-app-testing`** again, until the app is ready.

### 1A. How to run the first step on this prototype

- The prototype is not a single HTML file. It is a React app (`prototype/src`, routes in `prototype/src/App.jsx`) with its own tests and documents. Treat `prototype/src`, `prototype/api`, `prototype/docs` and `prototype/index.html` as "the prototype". The inventory script handles JSX only roughly, so read every file as the skill says, one portal at a time (client, team, manager, front office, management, auth), and use the running prototype (`cd prototype && npm install && npm run dev`, http://localhost:5173, log in through the demo picker; on the client Engagement Dashboard press "Load demo data") to look at each screen.
- **The 235 tests in `prototype/scripts/*.test.mjs` are the specification of the calculations and checks.** Use their expected numbers as the worked examples in the CALC and BR items and as acceptance criteria.
- `prototype/docs/execution-decisions.md` and `prototype/docs/source/` hold the business rules the prototype cannot show. Treat them as department input (source "Department input").
- The prototype has no real API keys. `.env.example` has placeholders only. Customer names in its sample data are made up for the demo; still write them as "Sample Client A" style in the PRD.
- The PRD template's section 18 still says PostgreSQL in places. The database standard in the same skill is **SQLite**. Use SQLite everywhere.
- `check_prd.py` will warn about many prototype functions that are not mentioned in the PRD. Cover them in section 22 grouped by file or module (one row per module with its functions listed). Do not drop real features to quiet the warnings.
- Sample data in the prototype's Manager, Front Office and Management portals is not business rules (five sample files do not mean five files). The PRD still has to describe those screens and their real data needs.

### 1B. My prepared answers for the skill's Step 4 questions

**Anything to add (Department input, version 1 unless stated):**
- Everything in `prototype/docs/execution-decisions.md` is a requirement, including its open questions with their stated defaults.
- Everything listed in section 5 of this prompt is in scope for version 1: the client flow, the opening balance check, the real Reports & Documents issuing step, execution tools tied to the client file, real data in the manager, front office and management portals, real login, notifications, and document storage.
- Monday.com is Later phases (interface and clearly labelled stub only). The company server folder is a configurable upload path.
- Roles (confirm from the PRD): client user, audit lead, audit associate, audit manager, front office, front office manager (approves proposals; only front office sends them), management, administrator.

**Defaults for the clarifying questions:** sample data is made up; version 1 integrations are Anthropic (document reading and the opening balance review), Odoo (proposals and leads) and email; AI platform is the Claude API through the backend; English only, left to right; currency SAR; money shown with 2 decimals; dates as DD MMM YYYY.

## 2. What the stack means for this prototype

The prototype is JavaScript with browser storage and a few Vercel functions. The skill's stack is fixed: React + TypeScript + Vite, FastAPI + Pydantic, SQLite + SQLAlchemy + Alembic, REST under `/api/v1/`. So:

- **Business rules move to the backend.** The prototype's rule modules in `prototype/src/utils/` (pure functions, with 235 tests in `prototype/scripts/`) are the specification of the behaviour. Re-implement them as Python services with `Decimal` and re-create their tests as pytest tests with the same expected numbers. They include: trial balance format and general ledger checks (`tbFormat`, `generalLedger`, `partyBreakdown`), opening balance check and review (`openingCheck`, `openingReview`), requirement list engine (`requirementsEngine`), TB review (`tbCore`, `tbChecks`), sampling and vouching (`sampling`, `vouching`), salary, GOSI, EOSB, prepaid, depreciation (`salary`, `eosb`, `prepaidDep`), IFRS trial balance and financial statements (`ifrs`, `fsPrep`), lead scoring and proposal drafts (`leadScoring`, `proposalDraft`), basic documents intake (`intake`), allocation, queries, audit log and archive (`allocationCore`, `queriesCore`, `auditLogCore`, `closureCore`), zakat.
- **Excel workbooks** are generated by the backend with openpyxl. The prototype builds them with ExcelJS (`*Excel.js`, `tbExcel`, `eosbExcel`). Keep the same sheets, layout and **live formulas**. The format files in `prototype/docs/source/` are the templates.
- **The four `prototype/api/*.js` functions** become backend integrations/AI features: document reading (`read-document`: proposal, CR, AOA, engagement letter, previous year trial balance, intake documents), the opening balance AI review (`opening-review`), Odoo proposals (`odoo-proposal`), email (`send-proposal-email`, Microsoft Graph). Copy the prompts and JSON schemas.
- **AI goes through the backend AI layer only**, with versioned prompt files, `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY` (the skill's names; the prototype used `ANTHROPIC_*`). Every AI result that matters is stored as a pending recommendation that a person approves. In this app that is already the case: the audit team confirms the opening balance review and checks document readings before anything is accepted.
- **Variable names follow the skill:** `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY` (prototype: `ODOO_USER`); email through `EMAIL_PROVIDER` with a `smtp` provider (`SMTP_*`), a `log` provider for development, and a `graph` provider for Microsoft 365 (`MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MAIL_SENDER`) if I choose it. Anything else: `<PLATFORM>_BASE_URL` / `<PLATFORM>_API_KEY`.
- **Money** is `Decimal` / `NUMERIC` in the database, a string in JSON. The prototype used JavaScript numbers with rounding; the tolerance (1 currency unit) becomes a setting.

## 3. Keeping the look and behaviour exactly as built

The department approved this design. Reproduce it screen by screen: same labels, field order, table columns, buttons, colours, spacing, dark and light themes, sidebar and header of each portal, login screen and animation, toasts and modals, status pills, expandable requirement rows, the Workspace tabs, the lifecycle bars. Reuse the prototype's CSS, Tailwind config and the same UI libraries (Tailwind, framer-motion, lucide-react, recharts) installed through npm. Move code over to TypeScript and into the skill's folder layout; do not redesign. For every screen, run the prototype (`cd prototype && npm install && npm run dev`, http://localhost:5173) next to the new app and compare. A screen is finished only when it looks and behaves the same.

The skill tells you to remove some prototype devices. For this app:
- Browser storage as a database, sample arrays, `alert()`: remove, replace with the API and the shared Toast / ConfirmDialog (same appearance as today).
- The demo portal picker on the login page ("Explore the demo") and the Audit Lead / Associate switch in the team header: replace with a real sign-in and the signed-in user's real role. Keep the look of the login page and the header.
- The "Load demo data" card and demo buttons ("Use demo data", "Use demo trial balance"): these become the idempotent, anonymised seed script (an ABCPA and a MISCPA client, existing and new, with trial balances, general ledgers, previous year audited trial balances, requirement lists). The client and team portals then show seeded data from the database, not an empty state. Never put real client data into seed data or tests.
- Existing vs new client, and the allocated firm (ABCPA / MISCPA), are client attributes from the database (allocation and audit history), not choices on a demo card.

## 4. The business flow in the prototype (the PRD must capture it)

1. The client's first requirement is to upload the **trial balance** and the **detailed general ledger** (every transaction). Both are checked on upload and rejected with the reasons shown to the client.
   - Trial balance columns: ledger name, account code, opening, current year debit, current year credit, closing. Ledger level only, no group or sub-group balances, except trade receivables, trade payables, advances from customers and advances to suppliers (one line each). Opening + debit − credit = closing.
   - General ledger: agrees with the trial balance per ledger, party names on the receivable/payable/advance lines and the parties add up to the trial balance line. The party-wise balances then replace those lines. Store the transactions in the database (the prototype only kept party totals).
2. **Previous year audited trial balance:** for an **existing** client the allocated audit team member uploads it (Excel or PDF); for a **new** client the client uploads it or says it is the first audit.
3. **Opening balance check in two steps:** code compares opening balances with the audited closing balances by statement area; only if something is flagged are the flagged ledgers sent to the AI, whose proposals (same balance under another name, code or grouping) are verified by adding the amounts in code before they clear a flag. The AI can never change a number. Without a key, exact amount matching is used and labelled. The team then confirms, with an explanation if differences remain, and approves.
4. Approval issues the **requirement list** of the allocated firm (ABCPA 20 categories / MISCPA 18, in `prototype/src/data/`), filtered from the trial balance, marks the detailed trial balance requirement accepted, applies the party-wise balances and fills the working trial balance. Nothing is shown to the client before the trial balance is approved.
5. The client uploads documents, the team accepts or rejects with a reason (shown to the client), the client re-uploads. Queries (shared by client and team), activity log (from the audit log), adjustments (team proposes, client approves, closing balance updates), reports and documents.
6. The team's execution tools (under My Workspace > Audit Procedures) work on the client's file: TB review (3.3), sampling, vouching, confirmations (3.4), salary / GOSI / EOSB / prepaid / depreciation (3.5), IFRS trial balance and financial statements (3.6), engagement letter, basic documents intake (1.2), file allocation (6.1), query tracker (6.2), audit log (6.3), archive and closure (6.4), lead scoring and proposal approval (1.1, the FO manager approves, only front office sends).

## 5. Pending work (halfway or not started)

### A. Questions I still owe you (ask me, do not decide)
- The exact trial balance and general ledger columns and my real general ledger export layout (assumed: Date, Voucher no, Account name/code, Party, Narration, Debit, Credit, with opening balances as "Opening balance" lines). I will supply a sample.
- Opening balance check: should any difference block approval or only need an explanation? Tolerance?
- Requirement lists: the rules that decide which categories apply to a trial balance are the prototype author's reading of the category names (`requirementsEngine`). Confirm per category; confirm whether small balances should be dropped (materiality floor).
- The open items in `prototype/docs/source/Audixa_Open_Items.xlsx` (credentials, templates, rule confirmations, app behaviours such as procedure locking, a client picker in the tools, the manager portal sidebar, whether the client uploads basic documents).
- The wording corrections made to both requirement lists (decision 43).

### B. Built as a demo only, must be built for real
- Reports & Documents for the client: there is no step for the team to issue the engagement letter, Zakat return, draft and final financial statements; the client's signed-copy uploads are not saved.
- The execution tools are not tied to the client file (own uploads and "use demo" buttons). They must read the client's approved trial balance and general ledger, including party-wise lines for AR/AP sampling.
- The manager, front office and management portals, team chat, messages, notifications, meetings and deliverables run on sample data. Drive them from the database.
- Lead scoring "Sync now" from Odoo is simulated; the proposal approval workflow needs real notifications; basic documents intake needs real file storage and reminders.
- Procedure locking and sequencing in My Workspace is not enforced.

### C. Credentials (nothing is connected yet; I add them to `project/backend/.env` myself)
Anthropic (document reading, opening balance review), Odoo, Microsoft 365 or SMTP mail, Monday.com, the company server folder for documents, the database. Until then each feature shows "not set up".

### D. Quality
The prototype has about 60 lint warnings (React style notes, unused parameters); do not carry them over.

## 6. Definition of done

The skill's Appendix D checklist, plus: every portal runs on real data from the database; the flow in section 4 works end to end for both firms; every screen matches the prototype; all questions in section 5A are answered and recorded in `project/docs/ASSUMPTIONS.md`; `analytix-app-testing` reports the app ready with no open serious bugs; `verify_project.py` reports no errors.
