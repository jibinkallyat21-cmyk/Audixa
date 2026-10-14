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

## Open items to ask later

- **ABCPA vouching.** The audit lead will supply documents. Not built until received. MISCPA vouching follows the Vouching Rule Book.
- **Liquidation audit, second extra document.** The Rule Book calls it "Osama letter". It is a letter received from the Ministry. Ask for the exact name and what it states (which date feeds the audit period end date).
- **Monday.com details.** API token (integration user), board and group for EL requests, how a client's item is found, whether auditors reply with file columns or updates, where the request text goes.
- **Company server storage details** (see decision 2).
- **Step 4 for ABCPA.** Confirm whether the Rule Book's shareholder / parent-company GM / authorisation-letter checks also apply (assumed yes).
- Remaining questions 10 to 16 in `docs/execution-gap-list.md` section 8.
