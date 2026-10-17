# Prototype update after the hand-over export: what changed and how it must behave

Purpose: the real app (`project/`) is being built from the prototype as it was at the hand-over export (commit `a4c8eea`, "Record open questions Q9, Q27, Q46"). The prototype was refined afterwards (50 commits, ending at PR 61, commit `2cb3a97`). **Do not replace or edit the `prototype/` folder in the company repository while the build runs.** Treat this file as an addendum to the product requirements: where it differs from the earlier documents, this file wins. Code first; AI only on exceptions; a person decides every flag; AI never changes a number; nothing is invented, plugged or forced to agree.

Reference only (read, do not copy into the repo): the updated prototype is `main` of `jibinkallyat21-cmyk/Audixa`. The file names under each heading point to where the behaviour lives in that prototype. `prototype/docs/self-review-decisions.md` in that repo records each decision with its assumptions.

How to use this in the build: for each section, find the module that owns the screen, add the behaviour to its requirements and tests, and build it in the order of the existing build plan. Sections 1 to 4 change shared data and should land first.

---

## 0. Things that exist only in the prototype (do not build for production)

- "Use demo with corrected opening balances", "Upload demo documents", "Use the client's data" buttons and the demo client scope of the team portal.
- Generators that stand in for reading uploaded files (bank statement figures, document fields, the client's sales/purchase registers, related party listing, schedule lines). In the real app these come from the client's actual uploads, read by the extraction step; wherever the prototype shows "what the document shows", the real app shows what was read from the file, with a manual correction field.
- The related party list and the related party transaction listing are demo stand-ins for the client's declaration and ledger.

## 1. Requirement list: grouping, automatic bank requests, samples, remarks

Files: `utils/requirementAreas.js`, `utils/bankAccounts.js`, `utils/requirementsEngine.js`, `utils/requirementsStore.js`, `utils/sampleRequests.js`, `components/client/AreaRequirements.jsx`, `pages/team/workspace/TeamWorkspaceRequirements.jsx`, `components/shared/RemarkThread.jsx`.

1.1 **Grouped by audit area, same view for client and audit team.** Order: Trial balance and ledger (TB, GL), Cash & Cash Equivalents, Trade Receivables, Inventory, Prepayments & Other Receivables, Fixed Assets, Trade Payables, Accrued Expense & Other Payables, Non Current Liabilities, **Related Parties**, Equity, Revenue, COGS, Expense, Salary, then Other. Empty groups are hidden. Rule-book category to group: CASH, BANK and the per-account bank items to Cash; TR to Trade Receivables; INV to Inventory; PP and SA to Prepayments; FA to Fixed Assets; TP to Trade Payables; ACC and VAT to Accrued Expense & Other Payables; LN and EOSB to Non Current Liabilities; RP to Related Parties; SALES to Revenue; PUR to COGS; EXP and RENT to Expense; SAL to Salary. (Assumptions to confirm: VAT, loans, EOSB, rent and staff advances placement.) Each group holds three kinds of items: Documents, Samples, Cut-off, with counts and a progress bar. A sample or cut-off item goes to the area it was raised for.

1.2 **Bank requests are created automatically from the trial balance when the list is issued.** One set per cash or bank ledger with a balance: bank confirmation as at year end, statement for the audit period, statement for the month after year end; a cash account needs only its cash count or confirmation. The general bank statements / confirmations / reconciliation / cash-count requests are not issued. **A bank reconciliation is requested only for an account whose statement closing balance differs from its trial balance closing**, by a person pressing "ask for the bank reconciliation". If an older list has the general requests, they are replaced and whatever the client had uploaded is carried over to the matching account document; nothing is asked twice. A new bank ledger in a later trial balance adds its own set.

1.3 **Samples and cut-off items become requirements only after a person approves them.** One requirement per item with: reference (SMP-… or CUT-…), date, ledger, description, amount, sub-group (Above materiality / Selected below materiality; Debits / Credits; Before / After year end; Trade Receivable / Trade Payable), who approved and when. The client uploads against each item; a short explanation is required even when a document is provided and mandatory when there is none. The same transaction is never requested twice (stable key per item). Statuses: Pending Client, Uploaded Processing, Under Review, Accepted, Rejected (reason required). Reminders: the team sends a reminder for items waiting longer than N days (default 3, editable); a reminder restarts the waiting time. Overdue items appear as a task and in the file summary.

1.4 **Remarks thread on every requirement, sample and cut-off item**, both ways (Client, Audit team), each entry with author, time and text. "Send as explanation (no document)" lets the client answer with an explanation alone: the item goes to the team for review marked "explanation only". Client remarks are written to the audit log (category client response) and the team's notifications; team replies are logged as document requests.

1.5 **Sent samples and cut-off items stay and can be changed.** Wherever a sampling or cut-off tool is opened it first shows everything already sent for that area (and, for cut-off, for that account), with delete per item and delete all (a second confirmation when the client already uploaded). Picking again adds more; items already sent are not offered or sent again. Deleting removes the item from the client's list and is logged.

## 2. Audit areas workspace and file summary

Files: `utils/auditAreas.js`, `pages/team/workspace/TeamWorkspaceAreas.jsx`, `TeamWorkspaceSummary.jsx`, `components/team/WorkspaceHeader.jsx`, `pages/team/TeamFiles.jsx`.

2.1 **Entering a file's workspace opens the File summary.** Tabs on every workspace page, one row: File summary, Requirements, Queries, Audit areas, Other procedures, Working TB, Deliverables, Audit Trail. The file summary shows requirements received/accepted, procedures done, open queries, "needs your attention", samples and cut-off sent, and every area with balance, progress, sent/waiting/rejected.

2.2 **Areas are laid out like the financial statements**, in sections Assets, Liabilities, **Related parties**, Equity, Income and expenses, Unclassified, each area showing its trial balance accounts and a total from the approved TB. Every TB group lands in an area; accounts that fit none go to Unclassified.

2.3 **Procedures per area (same pattern everywhere): what can be done together is one procedure; Sampling, Vouching and Cut-off are separate procedures.**
- Cash and cash equivalents: Cash and bank accounts (section 6); Cash and bank cut-off.
- Trade receivables / Trade payables: Supporting documents; Sampling and confirmations; Vouching.
- Revenue / Cost of sales / Operating expenses: Sampling; Vouching; Cut-off.
- Prepayments: Prepaid expenses schedule and supporting documents (one tool). Fixed assets: Depreciation and supporting documents (one tool). Accruals: Accruals schedule and supporting documents (one tool).
- Payroll and employee benefits: one tool with three tabs: Salary schedule, GOSI and end of service, Supporting documents.
- Borrowings, Inventory, Equity: Supporting documents.
- Related parties (own section): Supporting documents; Sampling of transactions (ABCPA); Vouching.
- Zakat and tax, Unclassified accounts: notes only.
Each procedure has Not started / In progress / Complete, a notes and conclusion box, and shows what the client has sent. The "Other procedures" tab keeps only file-wide procedures (analytical procedures, engagement letter and basic documents, financial statement preparation, queries, audit log, closure). Opening balance verification is done in the trial balance review and is not repeated.

2.4 **Trial balance checks fold once the trial balance is approved**: the client TB, party-wise balances and opening balance check stay open until approval, then collapse to one line with "Show the checks".

## 3. Materiality (ABCPA files only)

Files: `utils/materiality.js`, `utils/materialityStore.js`, `components/execution/MaterialityDialog.jsx`.

- File summary has a Materiality card with "Set materiality". The dialog is the numerical threshold table: basis, amount from the approved trial balance, typical percentage, percentage applied, possible materiality. Bases and typical ranges: Sales / revenues 0.5% to 1% (default applied 1); Total assets 0.5% to 1% (0.5); Total equity 1% (1); Income before zakat/tax 5% to 10% (5). One basis is chosen ("Yes"); materiality = percentage of that basis; a percentage outside the range is flagged; a basis at or below zero cannot be chosen. Result line: "Based on the above considerations, the materiality is: SR x".
- Total assets = cash, receivables, prepayments, inventory, PPE cost less accumulated depreciation, intangibles. Total equity = capital + reserves + retained earnings + the year's income (assumption). Income before zakat/tax = revenue and other income less cost of sales, operating and finance costs.
- Only the basis and percentage are saved; amounts are recomputed from the client's current trial balance wherever used.
- **The sampling tools and the related party tool use 80% of materiality** (confirmed). A figure can be typed over it for one test.
- **Gate:** on an ABCPA file without materiality the file summary shows a red notice and the audit areas cannot be opened: opening them redirects to the file summary with the materiality window open; saving continues to the audit areas. MISCPA files are not gated.
- Inside an audit area the sampling tool does not ask which area is tested; the procedure fixes it. The area selector stays only on the stand-alone sampling page.

## 4. Sampling, cut-off and vouching rules

Files: `utils/sampling.js` (unchanged rules), `utils/cutoff.js`, `components/execution/CutOffTool.jsx`, `SamplingTab.jsx`, `VouchingTab.jsx`, `SendSamples.jsx`.

- **Framework by firm (unchanged):** MISCPA uses the 50% rule books; ABCPA uses the materiality method (everything above materiality; below it a sample by risk level, entity size, method). Materiality-method areas: Revenue, COGS, Expenses use only that area's ledger accounts; Trade receivables and payables use the party list (debit balances for receivables, credit for payables).
- **Cut-off numbers are set by the team; nothing is preset.** ABCPA: from the subsequent bank statement, the team sets the number of debits and of credits, in date order, bank charges left out; every other area one number from the subsequent period in date order. MISCPA: the last N before and the first N after the year end (bank charges left out of bank). The client request for a bank item says a bank voucher or receipt is not accepted; for other areas an explanation is required even with a document.
- **Cut-off is done per cash or bank account**, each with its own numbers and its own block on the client's list. Other areas have one cut-off each.
- The team sees the picked items and approves before anything reaches the client.
- Vouching rows come from the samples sent; a sample counts as received once the client uploaded against it.

## 5. Supporting documents (evidence) framework

Files: `utils/evidence.js`, `utils/evidenceSchedules.js`, `utils/accruals.js`, `components/execution/EvidenceDocs.jsx`, `EvidenceSchedule.jsx`, `AccrualsTab.jsx`.

- A line is backed by up to three documents: the agreement (where the item has one), the tax invoice (a government receipt for fee categories outside VAT), and payment proof where the area needs payment. **The figures (company name, vendor or counterparty name, net amount, period or date) are read from the agreement or the invoice, whichever shows them, and compared with the line.** Payment proof is anything that validates the payment (bank statement entry, voucher, transfer or SADAD receipt, cheque with clearing); it is checked for company, counterparty and amount (net plus VAT; a part payment is accepted where a later receipt or repayment is expected).
- Statuses per line: Supported and paid / Supported (no payment needed, none given) / Supported, payment not shown / Mismatch / Not received. Each check is listed with a tick; a person accepts the evidence or raises it with the client (both logged). Code compares; AI reads a document only when code cannot; a person decides every flag.
- **Clients upload under any file name; the app shows every document under a standard name** `<Area> - <Item> - <Document type>.<ext>` and keeps the original name beside it, with a View button showing what was read.
- Documents per area (assumptions to confirm): Prepaid: agreement (rent and insurance categories only), invoice, payment. Fixed asset additions: invoice, payment. Accruals: contract (if applicable), invoice or statement, payment after year end; accruals must add up to the trial balance accruals. Sales vouching: invoice (required), delivery or contract proof and receipt (if applicable). Purchases and expenses vouching: supplier invoice, payment. Trade receivables: statement of account or confirmation, receipt after year end (if applicable). Trade payables: supplier statement or confirmation, payment after year end (if applicable). Inventory: stock count sheet, third-party confirmation (if applicable). Borrowings: loan agreement, lender statement or confirmation, repayment proof (if applicable). Related parties: confirmation or statement, agreement and payment/receipt (if applicable). Equity: registration or articles for capital, resolution or prior-year statements for reserves, proof of capital paid in (if applicable). End of service benefits: computation, employment contracts and payments to leavers (if applicable). Salary and tax: not yet defined.

## 6. Cash and bank accounts (one page)

Files: `components/execution/CashBankTool.jsx`, `utils/bankAccounts.js`, `utils/cutoff.js`.

- A table, one row per cash or bank account in the trial balance: account, trial balance figure, confirmation (status and view), statement for the current period (status and view), statement for the subsequent period (status and view), statement closing balance, difference, cut-off progress with a link to the cut-off procedure, overall status. Open a row for: Documents (standard name, view, accept, reject with reason), Confirmation checks, Balances, and Reconciliation (only when the difference is not zero).
- Statement figures (opening, money in, money out, closing) come from the uploaded statement, never typed again; the closing balance can be corrected if read wrongly. Opening plus money in minus money out is checked against the closing balance.
- Confirmation checks are the six tests (amount against TB, date against year end, signature and seal or e-generated mark, client name, bank name, letterhead) with the existing overall results; a client-provided confirmation is flagged as weaker evidence.
- Account status: Waiting for the client / Documents to review / Difference: reconciliation needed / Reconciliation to review / Reconciled / Confirmation needs attention / Agreed.

## 7. Related parties (ABCPA transaction testing)

Files: `utils/relatedParty.js`, `components/execution/RelatedPartyTool.jsx`, `RelatedVouching.jsx`.

- The team enters materiality (default from section 3), **how many transactions above and how many below materiality**; nothing is preset.
- Flagged transactions are picked first (code, not AI): round amount (10,000 or more and a multiple of 1,000); just below materiality (90% to 100%); same party, date and amount twice; vague description (misc, adjust, other, various, sundry or empty); close to the year end (last 5 days) with an amount of at least half of materiality. A Friday or Saturday posting is shown as a weak indicator only. The remaining places are the largest above materiality and a seeded random choice below. Flagged transactions beyond the numbers are listed separately.
- **A picked transaction that is already a sample or cut-off item in another area shows "Already tested in <area> (<item ref>)" with a link to that exact line, and is not asked from the client again.** Match: same reference, or same date and amount when there is no reference.
- Approved transactions go to the client as requirements; Vouching then shows, per transaction, the agreement or invoice and payment proof with the section 5 checks.

## 8. IFRS trial balance and financial statements

Files: `components/execution/FinancialStatementsView.jsx`, `IfrsTBTab.jsx`, `utils/ifrsExcel.js`, `utils/fsSchedules.js`.

- **The IFRS TB is needed only when the client is engaged for zakat filing (the zakat service on the client profile), for ABCPA and MISCPA clients alike.** Otherwise the page says it is not required. Only the audit type the client was engaged for is shown (proper or disclaimer), never both. **The "Financial statements" tab (the MISCPA statutory format) is shown for MISCPA files only.**
- Workbook (proper audit), in this order: Client TB, **IFRS TB (only three columns: ledger name, closing balance of the year, closing balance of the previous year)**, Balance sheet, P&L, Statement of equity, Prepaid, Depreciation, EOSB, GOSI Expense, Schedule checks, then the working sheets the statements are built from (IFRS TB working columns, mapping, adjustments, capital, COGS, reconciliation, pending list, VAT, verification). The disclaimer workbook has no schedules.
- **Every schedule is checked against the trial balance**: prepaid unexpired amount, fixed asset closing cost, closing accumulated depreciation, depreciation charge, EOSB provision, GOSI expense (where the TB has a GOSI ledger). A difference is flagged on the page, listed in the pending sheet and in Schedule checks, and the page offers "Tell <name>": the person who prepared that schedule (from the audit log; otherwise the file's associate) is notified. Nothing is adjusted to force an agreement. (Assumption to confirm: who is told for which schedule.)

## 9. Audit log and recent activity in every portal

Files: `utils/auditLog.js`, `components/shared/RecentActivityCard.jsx`, `pages/frontoffice/FOAuditLog.jsx`, `pages/management/ManagementLog.jsx`.

- One shared log. **Every list of the log or of recent activity is ordered by the time the event happened, newest first.**
- Every portal has the log and recent activity: client (Activity Log and dashboard), audit team and manager (Audit Log, dashboards), front office (new Audit Log page and menu item; dashboard shows live activity), management (new "Audit trail" tab on its Audit Log; recent activity on its dashboard).

## 10. Layout

- Screens narrower than 1440px scale down in steps (root font 15px; 14px under 1280px; 13px under 1100px) so every page keeps its layout on laptops; wide monitors are unchanged. The workspace tab row stays on one line.

## 11. Still open

Q9, Q27, Q46 (to be answered). The documents each area needs (section 5, assumptions), the requirement group placement of VAT, loans, EOSB, rent and staff advances, total equity definition, who is told about each schedule difference, the default reminder period, whether bank charges are excluded from MISCPA bank cut-off, evidence for Salary and tax, and the cash denomination count of the old confirmation tool (not carried over).

## 12. Acceptance checks

1. Approve a trial balance with one bank ledger: the requirement list shows three bank items (confirmation, two statements) under Cash & Cash Equivalents and no general bank items; change the statement closing balance by 500 and a reconciliation can be requested.
2. ABCPA file with no materiality: Audit areas redirect to the file summary with the window open; saving continues; materiality 24,000 on sales of 2,400,000 at 1%; sampling uses 19,200.
3. Pick 4 debits and 2 credits for a bank cut-off, send, reopen: 6 items are shown; pick 3 and 1 more: 10; delete one: 9; delete all: none; a transaction is never listed twice.
4. A related party transaction already sampled in Revenue shows "Already tested in Revenue (SMP-…)" and is not requested again.
5. Client posts a remark on a sample and sends an explanation without a document: the team sees it, the item is marked explanation only, the audit log shows it newest first in every portal.
6. Client not engaged for zakat: IFRS TB page says not required (both auditors); MISCPA shows the Financial statements tab only; ABCPA shows nothing else.
7. IFRS workbook has the sheets in section 8 in that order; the IFRS TB sheet has three columns; a schedule that differs from the trial balance is flagged and the preparer can be told.
8. Related parties appear as their own section in the audit areas and their own group in the requirement list.

## Addendum: AR / AP restructure and the alternative audit procedure

- `auditAreas`: receivables and payables each have one procedure (`ar-samples`, `ap-samples`, tool `party-area`), tabs Sample list and Pick samples. Old ids `receivables-evidence`, `ar-sample`, `ar-vouching` and the payables equivalents are removed.
- New: `utils/aap.js` (documents, tracing, failure text, demo data; tests in `scripts/aap.test.mjs`), `utils/aapExcel.js` (workbook, folder plan, ZIP; dependency `jszip`), `components/execution/PartySamples.jsx`, `PartyAreaTool.jsx`, `requirementsStore.setAap/patchAap`, client control "We cannot get a confirmation" in `components/client/SampleBoard.jsx`, confirmation request wording in `utils/sampleItems.js`.
- Backend to add in the real app: store the client's uploaded files in the client folder (Client / Trade receivables|payables / Party / Ledger, Invoices, Receipts|Payments), rename to the standard names, read real invoice, receipt and ledger data instead of `demoAapData`, and create the workbook server side.

## Addendum: fixed assets built from the client's invoices

- `utils/assetInvoices.js` (tests: `scripts/assetInvoices.test.mjs`): suggests the asset class from the invoice wording, queries repairs or maintenance, leaves unknown wording unclassified; builds one schedule line per confirmed invoice; compares invoice total with TB additions.
- `components/execution/AssetInvoices.jsx` in the fixed assets tool: each invoice and its payment proof are viewable (renamed to standard names), class and "treat as asset" are confirmed by a person, then "Create the asset lines". `assetsExcel.js` adds a "Source invoices" sheet to the depreciation workbook.
- Real app: read the invoices (OCR or reader) instead of `demoAssetInvoices`; same confirm-then-build flow.

## Addendum: trial balance tally and real client files

- Add `tbTally` (opening, debits and credits, closing) to the trial balance format check; reject at upload with the amounts; re-check on submit, in the review (approval blocked) and in the approve action. `workingTbTally` drives the "Balanced" indicator on the working trial balance (client and team); never hard-code it.
- The working trial balance is created only from an approved trial balance (tally + opening balance check + other checks).
- Client upload step must be visible on the Requirement List until a list is issued.
- Demo trial balance adjusted to tally (`data/demoTB.js`).
- Data source switch for a real client file (`demoData.loadDemoData(..., { own, clientName })`).

## Addendum: Supabase test backend

See `prototype/docs/self-review-decisions.md` (Supabase section). Only `utils/store.js`, `utils/supabase.js`, `main.jsx`, the login page and the sign-out button changed. The real app should use its own API instead, keeping the same storage boundary.

## Addendum: role-based access, demo switch, documents

- Access rules by portal (see `prototype/docs/self-review-decisions.md`, "Role-based access in the database"): the real app must enforce them on the server, with per-client data separation from the start.
- The audit log is split: full log (staff) and `client-activity` (what the client may see).
- Personal preferences are stored per user.
- Demo switch: `VITE_DEMO_DATA`; `prototype/docs/restore-demo-data.md`.
