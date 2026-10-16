# Hand-over prompt for the company Claude Code

Paste everything below the line into the new Claude Code session, opened in the unzipped repo folder.

---

You are taking over **Audixa (Audit 360)**, the platform of an audit firm (Analytix) that works for two audit firms, **ABCPA** and **MISCPA**. A working prototype exists in this folder. Your job is to turn it into the real application, using the Analytix skills you have (`analytix-prototype-to-prd`, `analytix-recheck-prd`, `analytix-prd-to-app`, `analytix-app-testing`, `analytix-fix-bugs`). It will run **locally only**. Vercel is not used.

## 0. Rules that apply to everything

1. **Do not invent audit rules.** The single source of truth is `docs/source/00_Audit360_Execution_Rule_Book.docx`, together with the decisions already taken in `docs/execution-decisions.md` (52 numbered decisions plus open questions). If a rule is missing or unclear, write it down as a question for me and carry on with the rest. Do not guess.
2. Read each skill's own instructions before using it and follow them for process and output format. Where a skill's stack differs from the prototype, the skill wins (see section 2). Where a skill would change a business rule, stop and ask me.
3. Work in the order in section 3. Show me each stage's output (PRD, recheck findings, test report) before moving on to the next, and give me the question list at each stage.
4. Minimise AI token use. The opening balance check is deliberately two-step: code first, AI only for what the code flagged, and every AI proposal is verified in code before it counts. Keep that pattern for any new AI use: code first, AI only on exceptions, never let the AI change a number.
5. Check the **production build** as well as the dev server. A crash once passed dev and failed in production.
6. Keep what is already tested. `npm test` runs 235 tests of the rule logic in `src/utils/*` (pure functions). Port them with the code; do not drop them.

## 1. What exists today (the prototype)

- React 19 + Vite, **JavaScript**, Tailwind, React Router. Six portals gated in the browser only (client, audit execution team, manager, front office, management). No real login.
- **No backend or database.** All data sits in `localStorage` through one module, `src/utils/store.js`. That module is the seam where a real API replaces the browser storage.
- `api/` has four Vercel serverless functions in Node: `read-document.js` (Claude reads PDFs/images), `opening-review.js` (AI step of the opening balance check), `odoo-proposal.js`, `send-proposal-email.js` (Microsoft Graph). They must be re-written in the backend (section 2).
- Rule logic is pure code in `src/utils/` with tests in `scripts/`. Excel workbooks are generated with ExcelJS and contain live formulas.
- Demo data: on the client Engagement Dashboard, "Load demo data" creates a demo client (ABCPA or MISCPA, existing or new). Without it the client and team portals are empty. Manager, front office and management portals still run on sample data in `src/data/sampleData.js`.
- Source documents are in `docs/source/` (Rule Book, requirement lists for both firms, Phase 1 definition, sampling documents and workbooks, format files for salary / IFRS trial balance / financial statements, and `Audixa_Open_Items.xlsx`, the list of what I still owe you).

### The client flow that is built (keep this behaviour)

1. The client's first requirement is to upload the **trial balance** and the **detailed general ledger** (every transaction), in the prescribed formats, both checked on upload and rejected with the reason (`src/utils/tbFormat.js`, `generalLedger.js`):
   - Trial balance columns: ledger name, account code, opening, current year debit, current year credit, closing. Ledger level only, no group or sub-group balances, except trade receivables, trade payables, advances from customers and advances to suppliers, which may be one line each. Opening + debit − credit must equal closing.
   - The general ledger must agree with the trial balance per ledger, and give party names whose totals equal the receivable, payable and advance lines. The party-wise balances then replace those lines.
2. **Existing client** (audited by us last year): the allocated audit team member uploads last year's audited trial balance (Excel or PDF). **New client:** the client uploads it or says it is the first audit.
3. The audit team checks the opening balances against it, **two-step** (`openingCheck.js`, `openingReview.js`, `api/opening-review.js`), confirms (with an explanation if differences remain) and approves.
4. Approval issues the requirement list for the allocated firm (`src/data/misRequirements.js`, `abcRequirements.js`, filtered by `requirementsEngine.js` from the trial balance), marks TB-01 accepted, applies party-wise balances and fills the working trial balance.
5. The client uploads documents; the team accepts or rejects with a reason; the client re-uploads. Queries (shared tracker), activity log (from the audit log), adjustments proposed by the team and approved by the client all work.
6. Execution tools under My Workspace > Audit Procedures: TB review (3.3), sampling, vouching and confirmations (3.4), salary / GOSI / EOSB / prepaid / depreciation (3.5), IFRS trial balance and financial statements (3.6), file allocation (6.1), query tracker (6.2), audit log (6.3), archive and closure (6.4), engagement letter, basic documents intake (1.2), lead scoring and proposal approval (1.1).

## 2. Target stack and what changes

- **Frontend:** React + **TypeScript**. Port the prototype, keep the UI, layout and behaviour the users have approved.
- **Backend:** **FastAPI** with **SQLite**, run locally. Replace `src/utils/store.js` usage with API calls, and the browser-only portal gating with real login and roles (client, audit team lead/associate, manager, front office, management). Add file storage on a local folder for uploaded documents.
- Re-write the four `api/*.js` functions as FastAPI endpoints (Anthropic Python SDK; same prompts and JSON schemas; Odoo JSON-RPC; Microsoft Graph mail). Configuration through a local `.env` (see `.env.example`). Remove `vercel.json` and anything Vercel-specific.
- Decide in the PRD where each rule runs. The checks that decide whether a trial balance or general ledger is accepted should be authoritative on the server, with the same tests.
- The `src/utils` rule modules must keep their behaviour and tests (port to TypeScript, and to Python where the server needs them).

## 3. How to work: skills in this order

The prototype already exists, so no PRD has to be written from nothing. The skills still need a PRD as the contract between stages, so **generate it from the prototype**:

1. **`analytix-prototype-to-prd`**: input is this repo plus `docs/execution-decisions.md` and `docs/source/`. Output is the PRD. Mark every place where the prototype uses sample data, in-memory data or a stub as "to build". Put every unclear rule into an "Open questions" list rather than deciding it.
2. **`analytix-recheck-prd`**: check the PRD against the Rule Book, the decisions file and the code. Give me the list of gaps and conflicts. Stop and wait for my answers.
3. **`analytix-prd-to-app`**: build the app from the corrected PRD (section 2). Build in this order so each stage can be tested: authentication and database, the client flow in section 1, execution tools tied to the client file, the other portals, integrations.
4. **`analytix-app-testing`**: produce `BUGS.md` and the test report.
5. **`analytix-fix-bugs`**: fix from most serious to least, prove each fix with a test.
6. **`analytix-app-testing`** again. Repeat 5 and 6 until the app is ready.

## 4. Pending work (what was left halfway or not started)

### A. Answers I still owe you (ask me, do not decide)
- Prescribed trial balance and general ledger **exact columns** and the real general ledger export layout (current assumption: Date, Voucher no, Account name/code, Party, Narration, Debit, Credit; opening balances as "Opening balance" lines). A raw sample will be provided.
- Opening balance check: should any difference **block** approval, or only need an explanation? Tolerance (currently 1)?
- Requirement list: the rules that decide which categories apply to a trial balance are my reading of the category names (`requirementsEngine.js`). Confirm per category; confirm whether small balances should be dropped (materiality floor).
- Open items in `docs/source/Audixa_Open_Items.xlsx` (credentials, templates, rule confirmations, app behaviours such as procedure locking, client picker in the tools, manager portal sidebar, whether the client can upload basic documents).
- The wording corrections made to both requirement lists (see decision 43) need my confirmation.

### B. Built as a demo only, to be built for real
- **Reports & Documents** for the client: there is no step for the team to issue the engagement letter, Zakat return, draft and final financial statements. Client signed-copy uploads are not saved.
- **Execution tools are not tied to the client file.** TB review, sampling, vouching, confirmations, payroll/GOSI/EOSB, prepaid, depreciation, IFRS trial balance and financial statements take their own uploads and "use demo" buttons. They must read the client's approved trial balance, general ledger (including party-wise lines for AR/AP sampling, 3.4) and each other's outputs, with a client picker.
- The **general ledger transactions are not stored** (only party totals). The sampling and vouching tools need them stored.
- **Manager, front office and management portals** still show sample data: allocation and workload (6.1), performance, escalations, leads and the proposal pipeline, management dashboards. Drive them from the database.
- **Allocation** to the auditor (ABCPA/MISCPA) and **existing vs new client** are chosen on the demo card today. They must come from the allocation and from the client's audit history.
- Team chat, messages, notifications, meetings, deliverables pages still use sample data.
- Lead scoring (1.1) "Sync now" from Odoo is simulated; the proposal approval workflow needs real notifications; basic documents intake (1.2) needs real file storage and reminders.
- Procedures marked as built but without enforcement: procedure locking and sequencing in My Workspace.

### C. Integrations needing credentials from me (nothing is connected yet)
- Anthropic API key (document reading and the opening balance AI step) in the backend `.env`.
- Odoo (proposals, leads), Microsoft 365 mailbox via Graph, Monday.com, the company server folder for documents, the database.
- Until a credential exists, the screen must fall back and say so (the prototype already does this for the AI).

### D. Quality
- About 60 lint warnings remain (React style notes, unused parameters). Clean up while porting to TypeScript.
- Keep `npm test`/equivalent green, and add tests for everything new. Finish with an app test pass using `analytix-app-testing` on the running local app.

## 5. Definition of done

- Runs locally from one documented command each for backend and frontend; README explains setup.
- Every portal runs on real data from the database; no sample data in any portal.
- The client flow in section 1 works end to end, including rejection reasons, the two-step opening balance check, approval and the requirement list for both firms.
- All open questions in section 4A are answered by me and reflected in `docs/execution-decisions.md`.
- `analytix-app-testing` reports the app ready with no open serious bugs.
