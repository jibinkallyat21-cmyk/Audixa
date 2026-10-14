# Audit360 execution — gap list against the Rule Book

Source of truth: `docs/formatted/00_Audit360_Execution_Rule_Book.docx` (branch `docs/execution-rule-book`), read in full.
Compared with: the app on `claude/vibrant-edison-s6kpop` (same code as `main`).

Status key: **Covered** = works as the Rule Book says. **Partial** = a screen or data exists but the rule logic does not. **Differs** = built, but contradicts the Rule Book. **Missing** = nothing built.

## 0. What exists today (applies to every process)

- The app is a six-portal front-end demo (client, audit team, manager, front office, management). All data is sample data held in memory or `sessionStorage`. Nothing is saved between sessions.
- The only server code is `api/odoo-proposal.js` and `api/send-proposal-email.js`.
- There is no document-reading (AI/OCR) service, no Excel library (`package.json` has none) and no Anthropic dependency.
- So none of the Rule Book's calculations, checks or generated workbooks exist. "Partial" below means a screen exists, not that any rule is applied.

## 1. Process 2.1 — Engagement Letter

### Step 1 — EL request preparation: **Missing** (with two Differs)

| Rule Book | In the app today |
|---|---|
| Required inputs: signed or unsigned proposal, CR, AOA; ask FO to upload if CR/AOA absent | Not built. FO uploads exist only as generic slots in `FOClientDocuments.jsx` |
| Fixed request format (employee name, company, audit type, period, business entity, capital, revenue, estimated fee) | Not built |
| 3.1 Company name: compare CR and AOA, use English name, flag mismatch, block until resolved | Not built |
| 3.2 Audit type: from proposal, else client profile | **Differs.** App audit types are Proper, Disclaimer of Opinion, Special Purpose, Liquidation, Agreed-Upon Procedures (`utils/proposals.js`). Rule Book has Proper, Disclaimer, Liquidation, Special |
| 3.3 Audit period, scenarios 1 to 4 (match, mismatch with three options, first-year from CR start date, liquidation with two extra documents) | Not built |
| 3.4 Business entity from CR; 3.5 Capital from AOA; 3.6 Revenue from proposal | Not built |
| 3.7 Fee: audit fee + translation fee only | **Differs.** New Proposal form totals audit + zakat + accounts + translation (`SERVICES`). No separate EL fee exists |
| 4 Missing-information flow: red flag on FO dashboard, notify requester, input field, auto-update | Not built. FO dashboard shows "3 Engagement Letters Pending Capture" linking to `/fo/proposals?tab=el`, but that tab does not exist |
| 5 Auto-finalise as a text draft; allow share only when no mandatory gap or open flag | Not built |

### Step 2 — Verification of the EL received from the auditor: **Missing**

- Two source documents. The instruction note checks company name, audit fee and audit period against the EL request. The checklist has five checks (client signature and seal, auditor identity, letterhead, audit period, audit fee against the signed proposal) with Pass / Fail / Needs Review, evidence, page references and a final summary block.
- App: `foEngagementLetters` is sample data (status chips: Awaiting from Auditor, Received Ready to Forward, Forwarded Awaiting Signature, Signed Captured) and is not rendered anywhere. No verification, evidence or decision tracking.
- Monday.com is mentioned as where the auditor raises issues. Nothing in the app touches it.

### Step 4 — Signed EL and company stamp verification: **Partial**

- Built: client uploads a signed EL (`ClientReports.jsx`, key `signedEngagementLetter`); the team's Deliverables page shows "Received". Lifecycle stepper marks the EL stage done from a boolean.
- Missing: the four-item checklist (seal on all pages, shareholder signature on last page, parent-company GM signature, authorisation letter for a third-party signatory), Correct / Failed / N/A, the manual-signature-review flow, and tracking to completion.

*(Process 2.1 has no Step 3. Nothing to build.)*

## 2. Process 3.2 — Basic documents review: **Missing**

- Rule Book supplies five prompts: AOA (fiscal year, owners and parent, GCC/foreign class and MISA need, amendment status), MISA (expiry with 90-day warning, name/CR/capital match, shareholders), VAT certificate (company details, tax details, branches), Engagement Letter (name, year, seal and signature per page, fee and VAT), and EOSB (merge active and inactive contributor lists into a three-sheet Excel).
- App: basic-document upload slots and requirement lists exist (`FOClientDocuments`, `requirementSeed`). No review of document content.
- The Engagement Letter prompt overlaps with 2.1 Steps 2 and 4 (see question 6).

## 3. Process 3.3 — Opening balance and initial TB review

- Step 1 (build instructions and prompt): **Missing.** App has "Opening Balance Verification" as three tick-off sub-tasks in `TeamWorkspaceProcedures.jsx` and a Working TB with zakat. No PY AFS / PY TB / CY TB comparison, consolidation test, grouping, 11 checks, ratios or notes workbook.
- Steps 2 and 3: the Rule Book contains only a file name each (a TB review workbook and a consolidated TB example) and no rules. See question 9.

## 4. Process 3.4 — Sampling, vouching and confirmations: **Missing**

- App: "Sampling & AI Vouching" is four sample sub-tasks and a mock AI flag panel. No selection or testing logic.
- Step 1 Sampling: three rule books (Sales/Purchase 50% by taxable value capped at 30; Expense 50% with Include/Exclude and 7 per account; AR/AP/Advance 50% cumulative with confirmation and alternative-procedure trackers) plus two further documents that describe a different, materiality-based method. See question 10.
- Step 2 Vouching: Sales (ref from 6002.02), COGS (ref from 10002.02), AR/AP/Advances, Expense (ref from 10002 and also 10001.02). See question 11.
- Step 3 Cash and bank confirmation: ref numbering 5001/5002, six tests, bank statement cross-check, cash denomination check, decision table, workbook of six sheets, PDF stamping.

## 5. Process 3.5 — Payroll, GOSI/EOSB, prepaid, depreciation: **Missing**

- App holds only EOSB, prepaid and depreciation ledgers in the sample TB. A "Schedule Building" procedure row is a label.
- GOSI, EOSB and the Salary Schedule Builder (20-step workflow) have no build. The format file `3.5_Step-1_Format_Salary_Schedule.xlsx` has 15 columns (Iqaama Id … Month), while the Rule Book's built-in column set has 10. The Rule Book says the company format wins.
- Prepaid command and Depreciation command both require a shared template (`FA_NEW_SHEET.xlsx` and a prepaid template) that is **not in the folder**.

## 6. Process 3.6 — Financial statement preparation: **Missing**

- App has a Working TB (client TB, adjustments, zakat). It is not an IFRS TB: no mapping, no bridge, no balance sheet, P&L, equity, COGS or FS notes.
- Four rule sets: Disclaimer audit flow, Proper audit (IFRS TB, mapping, adjustments register, pending list), FS preparation rule book, and a system prompt. The rule book says the full prompt wins where they differ.
- Format files are present (`Format_IFRS_Trial_Balance`, `Format_Financial_Statements`).

## 7. Process 6 — treated as four features

| Feature | Covered | Differs | Missing |
|---|---|---|---|
| **6.1 File allocation and workload** | Allocation action and pending-files list; team workload bars; team plan (`ManagerWorkload.jsx`) | The "AI Best Fit" lead is a hard-coded value per file, not computed. Capacity uses file count only (red above 13, amber from 10). Rule asks for turnover, deadlines, high-complexity count, leave, review duties | Intake of the 11 factors (audit type, turnover band, nature of business, first-year, new/existing, previous-year team availability, previous-year issues, experience); Low/Medium/High complexity classification; continuity prompt; final allocation checklist |
| **6.2 Client query management** | Raise a query, thread, filters Open/Answered/Closed, close (`TeamWorkspaceQueries`, `ClientQueries`) | Records hold only id, subject, status, date, linked ref. Tracker fields required: query no., client, audit area, date raised, description, person responsible, due date, status, date received, replied / not replied, reply date | Due dates and owners, pending list, priority and critical flag, follow-up and escalation, response review before sending, firm-wide tracker, completion gate that blocks if critical queries are open |
| **6.3 Audit log and traceability** | Per-file audit trail (documents, queries, allocation, stage, meetings, AI) and firm-wide log with filters and export (`TeamWorkspaceAuditTrail`, `ManagementLog`) | Events are sample or in-memory, not persisted | Work performed per member and area; document request and response dates; who reviewed client responses; evidence links for conclusions; changes to working papers; review comments and resolution; adjustments with reason, amount, evidence, approval; file references; pending items; decisions; prepared / reviewed / approved trail |
| **6.4 Archiving and closure** | Qawaem filing checklist and signed-document receipt on Deliverables (covers item 15 in part) | None found | The 18-item closure checklist as a gate, final file review, payment status, archive action and locked read-only state |

## 8. Questions I need answered (Rule Book is silent or unclear)

Platform (needed before Process 2.1):
1. **Reading CR / AOA / proposal / EL.** The Rule Book assumes AI extraction. May I add a server function that calls the Claude API (needs `ANTHROPIC_API_KEY` in Vercel), with manual entry of the extracted fields as fallback and demo mode when no key is set, as the Odoo flow does?
2. **Storage.** The app saves nothing today. Is session-only storage acceptable for these processes for now, or do you want a database chosen first?
3. **Excel output** (3.2 EOSB onwards). OK to add an Excel library (`exceljs`) so the app generates the workbooks in the supplied formats?

Process 2.1:
4. **Audit types.** Replace the app's five with the Rule Book's four (Proper, Disclaimer, Liquidation, Special)? Where does "Agreed-Upon Procedures" go?
5. **Liquidation (Step 1, 3.3).** The second extra document is "Osama letter". Is that the exact document name?
6. **Step 2 scope.** The instruction note and the checklist differ (company name appears only in the note; seal, auditor identity and letterhead only in the checklist). Build the union of both? Also, the checklist names one firm, "MAAN Ibrahim Alshinkity CPA firm", but the app has ABCPA and MISCPA. Which firm does each map to, and should the 3.2 EL prompt and 2.1 Step 4 share the same engine?
7. **"Approved tax/fee comparison rule"** (Step 2, check 5) is not defined. How should VAT-inclusive and VAT-exclusive fees be compared?
8. **Who is "the employee raising the EL request"** in the app: the FO user? Is Monday.com needed, or only a manual note?
9. **Header text** "(Employee Name) Analytix _BO Audit": keep `_BO` literally?

Later processes (flag now so they do not surprise us):
10. **3.4 Sampling.** Two methods conflict: 50% by value (caps of 30 and 7) in the rule books, against materiality / confidence factor / random selection in the process flow and setup document. Which is authoritative?
11. **3.4 Vouching.** Expense references start at "10002" and also "10001.02"; COGS starts at "10002.02", which collides with the Expense series. Confirm one series per area.
12. **Dates and year-end.** 3.4 Step 3 hard-codes 31-12-2025; 3.5 EOSB uses 31 Dec 2025 while Depreciation says ask if not stated. Should year-end come from the engagement record?
13. **3.3 Steps 2 and 3** have example files only, no rules. Is there a rule document, or should those steps be skipped?
14. **Missing files.** Appendix A lists 14 attached files; only the Rule Book and three formats are in the folder. I need the prepaid template, `FA_NEW_SHEET.xlsx` and any examples you want matched.
15. **6.1 complexity.** Rule Book defines Low / Medium / High but not how a file is scored. What decides the class (turnover band, audit type, first-year, business nature)?
16. **Process 6 order.** Appendix B says the document does not map its four parts to 6.1–6.4. I used the document order: allocation, queries, audit log, archiving. Confirm.

## 9. Proposed build order after approval

2.1 Step 1, 2.1 Step 2, 2.1 Step 4, 3.2, 3.3, 3.4 (sampling, vouching, confirmation), 3.5, 3.6, then 6.1 to 6.4. Each is shown to you before the next starts.
