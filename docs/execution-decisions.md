# Execution build: decisions and open items

Answers given by the audit lead while going through `docs/execution-gap-list.md`. Demo target: 16 October 2026.

## Decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Document reading | Claude API through a server function (`ANTHROPIC_API_KEY`), manual entry as fallback, demo mode when no key |
| 2 | Storage | Browser storage for v1, kept behind one storage module. Later the company server folder replaces it (needs folder path, write access, always-on machine, address, backup info). Not reachable from Vercel |
| 3 | Excel output | Add `exceljs` |
| 4 | Audit types | Rule Book's four (Proper, Disclaimer, Liquidation, Special) plus Agreed-Upon Procedures |
| 5 | Firms | ABCPA = Ashraf Bassas CPA Firm. MISCPA = MAAN Ibrahim Alshinkity CPA firm. Names held as settings; auditor-identity check compares the EL to the engagement's firm |
| 6 | Step 2 checks (EL from auditor) | Company name, audit period, audit fee, auditor identity, letterhead. Client signature and stamp are not checked here |
| 6 | Step 4 (signed EL from client) | Different per firm. ABCPA: client stamp on every page, plus stamp and signature of the respective person on the last page. MISCPA: client stamp and signature on the last page only |
| 7 | Fee comparison | Proposal and EL show fees excluding VAT, one line per opted service (audit, Zakat filing, accounts finalisation, translation). Compare service by service. A service added after the proposal must be addable to the client profile with its fee. Step 1 request still carries audit fee and translation fee only |
| 8 | Roles | Audit managers (per firm) assign a Project Coordinator on the Team Plan screen. The coordinator, in the execution team, raises the EL request and sees the draft and Step 2 / Step 4 checks in the Audit Team portal. Issues are flagged on the respective FO dashboard and the coordinator is notified. FO or coordinator can type the missing information |
| 8 | Monday.com | ELs are requested and exchanged through Monday.com. Build send/receive screens and server function in demo mode; go live when API token and board details arrive |
| 10 | EL request header | First line is the logged-in user's name followed by "Analytix _BO Audit" |
| 11 | Framework by firm | The auditor chosen on the proposal decides the whole framework; nothing is mixed. MISCPA: 50% rule books (sampling). ABCPA: materiality method (above materiality 100%, random below). Applies from proposal creation onward |
| 12 | Vouching ref numbers (MISCPA) | Sales 6002.02, COGS 10002.02, Expense 10001.02. Cash 5001.xx, Bank 5002.xx. ABCPA numbering open until its documents arrive |
| 13 | Year-end dates | Taken from each engagement's audit period (set in the EL request); 31-12-2025 is only the default for FY2025 files |
| 14 | Process 3.3 Steps 2-3 | Step 1's build instructions are the full rule set; Steps 2-3 are example outputs |
| 15 | Templates for 3.5 | Audit lead uploads the prepaid template and FA_NEW_SHEET.xlsx before 3.5 is built |
| 16 | File complexity (6.1) | Points score from the 11 factors, mapped to Low / Medium / High; manager can override with a reason |
| 17 | Process 6 order | 6.1 allocation, 6.2 queries, 6.3 audit log, 6.4 archiving (document order) |
| 18 | Revenue category on proposals | Six categories: Zero turnover; Less than 1 Million; 1 to 5 Million; 5 to 10 Million; 10 to 50 Million; 50 Million & above. Choosing one sets the audit fee automatically (still editable). Fee numbers are PLACEHOLDERS in `src/data/feeSchedule.js` until the FO confirms them |
| 19 | Discount on proposals | "Apply discount" checkbox shows the discount amount. Provisional rule: 10% of the Zakat filing fee, sent as a negative line. Real logic to come from the audit lead after the FO is asked |
| 20 | EL request fee | Request to the auditor carries audit fee + translation fee only; every opted proposal service stays visible on the page |
| 21 | Client profile | Everything entered when a proposal is created (client, contact, CR number, city, auditor, audit type, revenue category, audit fee, opted services with fees, discount) is stored in a client profile (`src/utils/clientProfiles.js`). The EL request fetches the proposal details from it; services can be added to the profile later. Revenue in the EL request is the profile's revenue category unless an exact figure is entered |
| 23 | EL fees | The EL shows only the audit fee (and possibly the translation fee). Zakat filing and account finalisation fees are in the proposal only and are not compared. A translation fee opted in the proposal but not found in the EL is a low-priority note (non-blocking) shown to the project coordinator and on the FO EL Queries page. A wrong audit fee or translation fee is a FAIL |
| 22 | Step 2 build | Five checks (company name, audit period, audit fee by service excl. VAT, auditor identity, letterhead), each PASS / FAIL / NEEDS REVIEW with expected value, value found and page. Letterhead: the approved letterhead is the auditor firm's own, so it passes when the firm's legal name is found on it (a different firm's name fails; a spelling variant or unreadable name goes to review). Overall: VERIFIED only when all pass, a reviewer has signed off and no auditor query is open; NOT VERIFIED if any fails; otherwise PENDING. |
| 24 | Step 4 build | Signed EL check differs by firm. ABCPA: stamp on every page, stamp on the last page, signature of the shareholder / respective person on the last page, plus (applicable ones only) parent-company GM signature and authorisation letter (received, signed by the shareholder, stamped). MISCPA: client stamp and signature on the last page only; none of the extra checks ("resolution" items apply to ABCPA only). Items are CORRECT / FAILED / MANUAL CHECK / NEEDS CLARIFICATION / N/A. Unidentifiable signatures and missing documents keep the EL PENDING and notify the responsible employee; a failure flags it. Completed only when every applicable item is CORRECT and the employee has confirmed |
| 25 | Process 3.2 build | New "Basic Documents" page (Audit Team portal) per client with five tabs. Documents are read by Claude (manual entry and demo samples as fallback) and the rules run as tested code. AOA: fiscal year, owners and parent company, managers, GCC / Foreign / Mixed classification with MISA requirement, amendment status from the page 1 header. MISA: validity and 90-day warning, name / unified number / combined capital / shareholders against the AOA. VAT: details against the AOA, TRN digits, branches. EL: name, year-end, seal and signature on every page, fees, with a conclusion. EOSB: Active / Inactive Excel lists (columns matched by header name, several files with a registration number each) into one workbook with Active, Inactive and Exceptions sheets, live Total Salary formula, Arial, frozen headers, dd-mm-yyyy dates; names filled from PDFs only when blank. The "2025" window comes from the engagement's audit period (default 2025) |

## Open items to ask later

- **3.2 rules to confirm.** (a) GCC countries used: Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman. (b) A Mixed classification is not covered by the MISA rule, so the reviewer decides. (c) Text dates such as 03/04/2025 are read as day-month-year and flagged. (d) The 3.2 engagement letter review is separate from 2.1 Steps 2 and 4; confirm whether they should share one reading. (e) A Saudi VAT number is expected to have 15 digits.

- **Revenue category and fee allocation.** The audit lead will give the final categories and the fee for each (placeholders in `src/data/feeSchedule.js`), after asking the Front Office. Also confirm whether fees differ by firm (ABCPA / MISCPA).
- **Discount logic.** Final rule to come (provisional: 10% of Zakat filing fee, `src/data/feeSchedule.js`).
- **Revenue in the EL request.** Now shows the revenue category from the client profile (e.g. "1 Million to 5 Million (SR)"); an exact figure can still be entered. Confirm this is what the auditor needs.

- **ABCPA vouching.** The audit lead will supply documents. Not built until received. MISCPA vouching follows the Vouching Rule Book.
- **Liquidation audit, second extra document.** The Rule Book calls it "Osama letter". It is a letter received from the Ministry. Ask for the exact name and what it states (which date feeds the audit period end date).
- **Translation in the EL.** Audit lead is not sure whether the translation fee appears in the EL; for now its absence is only a low-priority note. Confirm later.
- **Monday.com details.** API token (integration user), board and group for EL requests, how a client's item is found, whether auditors reply with file columns or updates, where the request text goes.
- **Company server storage details** (see decision 2).
- **Step 4 'resolution'.** Read as the shareholder / parent-company GM / authorisation-letter checks, ABCPA only. Confirm this is what was meant.
- Sampling files uploaded on 14 Oct (AR/AP workbook, Revenue/COGS/Expenses workbook, setup docs, process flow, SAMPLING.docx) are identical in content to the Rule Book. Use the two workbooks as layout references for ABCPA sampling.
