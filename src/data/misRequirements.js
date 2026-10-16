// MIS (MISCPA) General Audit Requirements: the preset list from MIS_Req_list.xlsx. Typos corrected and written in sentence case; meaning unchanged.
// Which items apply to a client is decided from its trial balance (see utils/requirementsEngine.js).
export const MIS_REQUIREMENTS = [
 {
  "id": "TB",
  "title": "Trial balance",
  "items": [
   {
    "n": 1,
    "text": "Detailed trial balance for the audit period with opening balance, current year debit/credit transactions and closing balance. The opening balance of the trial balance needs to match the previous year audit report."
   },
   {
    "n": 2,
    "text": "Consolidated trial balance showing the individual trial balances and the consolidated figures, if applicable."
   }
  ]
 },
 {
  "id": "RP",
  "title": "Amounts due to/from related parties, shareholders, partners, etc.",
  "items": [
   {
    "n": 1,
    "text": "List of related parties with the nature of the relationship."
   },
   {
    "n": 2,
    "text": "SOA/ledger statements of related parties for the audit period."
   },
   {
    "n": 3,
    "text": "Balance confirmation from related parties."
   }
  ]
 },
 {
  "id": "LN",
  "title": "Loans",
  "items": [
   {
    "n": 1,
    "text": "Loan agreements/loan sanction letters."
   },
   {
    "n": 2,
    "text": "Loan statements for the audit period."
   },
   {
    "n": 3,
    "text": "Balance confirmation from the respective financial institutions/entities from which the loan was availed."
   }
  ]
 },
 {
  "id": "VAT",
  "title": "VAT",
  "items": [
   {
    "n": 1,
    "text": "Quarterly VAT computation statements in Excel, if available."
   },
   {
    "n": 2,
    "text": "Quarterly VAT returns."
   },
   {
    "n": 3,
    "text": "Quarterly VAT payment receipts."
   },
   {
    "n": 4,
    "text": "VAT reconciliation statements, if sales, output VAT or input VAT do not match the trial balance."
   }
  ]
 },
 {
  "id": "TP",
  "title": "Trade payables / advances to suppliers",
  "items": [
   {
    "n": 1,
    "text": "Trade payables ageing report with subsequent payments of outstanding amounts up to the date of sharing the report."
   },
   {
    "n": 2,
    "text": "Explanation for trade payables ledgers having opening balances and no movement during the year."
   },
   {
    "n": 3,
    "text": "Balance confirmation from trade payables covering more than 50% of trade payables in value, or subsequent SOAs showing payment of the outstanding amount as at the end of the financial year."
   },
   {
    "n": 4,
    "text": "Subsequent purchase details for advances to suppliers as at the end of the financial year."
   }
  ]
 },
 {
  "id": "FA",
  "title": "Fixed assets",
  "items": [
   {
    "n": 1,
    "text": "Depreciation schedule, if depreciation is already booked in the trial balance provided."
   },
   {
    "n": 2,
    "text": "All invoices for any addition or deletion in fixed assets."
   },
   {
    "n": 3,
    "text": "Ownership documents, such as the title deed, for any land and buildings in the fixed assets."
   },
   {
    "n": 4,
    "text": "Report from Tamm, along with the Istimara, if there are any motor vehicles in the fixed assets."
   }
  ]
 },
 {
  "id": "PP",
  "title": "Prepayments",
  "items": [
   {
    "n": 1,
    "text": "Prepayments schedule, if prepayments are already booked in the trial balance provided."
   },
   {
    "n": 2,
    "text": "All invoices, contracts and other supporting documents sufficient for the prepayments calculation."
   }
  ]
 },
 {
  "id": "SA",
  "title": "Staff advances",
  "items": [
   {
    "n": 1,
    "text": "Confirmation from the respective staff covering more than 50% of staff advances."
   }
  ]
 },
 {
  "id": "INV",
  "title": "Inventory",
  "items": [
   {
    "n": 1,
    "text": "Physical verification report of inventory performed by management, with reasons for variations."
   },
   {
    "n": 2,
    "text": "Explanations/supporting documents for any stock adjustments in the trial balance."
   },
   {
    "n": 3,
    "text": "Inventory movement report with opening, purchases, purchase returns, sales, sales returns, stock transfers, stock adjustments and closing balance in quantity and value."
   },
   {
    "n": 4,
    "text": "Item-wise closing stock statement with the name of the item, quantity, rate and closing value, certified by management."
   },
   {
    "n": 5,
    "text": "Closing work in progress calculation, if applicable."
   }
  ]
 },
 {
  "id": "TR",
  "title": "Trade receivables / advances from customers",
  "items": [
   {
    "n": 1,
    "text": "Trade receivables ageing report with subsequent receipts of outstanding amounts up to the date of sharing the report."
   },
   {
    "n": 2,
    "text": "Explanation for trade receivables ledgers having opening balances and no movement during the year."
   },
   {
    "n": 3,
    "text": "Balance confirmation from trade receivables covering more than 50% of trade receivables in value, or subsequent SOAs showing receipt of the outstanding amount as at the end of the financial year."
   },
   {
    "n": 4,
    "text": "Subsequent sales details for advances from customers as at the end of the financial year."
   },
   {
    "n": 5,
    "text": "Analysis report, if there is any provision for doubtful debts booked in the trial balance."
   }
  ]
 },
 {
  "id": "CASH",
  "title": "Cash",
  "items": [
   {
    "n": 1,
    "text": "Cash count report certified by management, with reasons for any variations (i.e. cash balance confirmation)."
   }
  ]
 },
 {
  "id": "BANK",
  "title": "Bank",
  "items": [
   {
    "n": 1,
    "text": "All bank statements covering the audit period and the subsequent one month."
   },
   {
    "n": 2,
    "text": "Bank reconciliation statements, if any."
   },
   {
    "n": 3,
    "text": "Bank confirmations."
   }
  ]
 },
 {
  "id": "SALES",
  "title": "Sales",
  "items": [
   {
    "n": 1,
    "text": "Sales and sales return register showing invoice number, invoice date, name of party, TRN, sale value, output VAT and total invoice value."
   },
   {
    "n": 2,
    "text": "Sales reconciliation statement, if there is any variation between sales as per the books and the VAT returns."
   },
   {
    "n": 3,
    "text": "Samples of sales invoices/credit notes covering more than 50% of the total value. If the number of invoices is high when applying this rule, we will share the list of invoices for which samples are required after receiving the sales register from you."
   },
   {
    "n": 4,
    "text": "Supporting documents, if there are export sales or any other zero-rated sales."
   },
   {
    "n": 5,
    "text": "Sample contracts with customers and the revenue recognition method, if revenue is from service contracts involving material and labour."
   }
  ]
 },
 {
  "id": "PUR",
  "title": "Purchases",
  "items": [
   {
    "n": 1,
    "text": "Purchases and purchase return register showing invoice number, invoice date, name of party, TRN, purchase value, input VAT and total invoice value."
   },
   {
    "n": 2,
    "text": "Samples of purchase invoices/debit notes covering more than 50% of the total value. If the number of invoices is high when applying this rule, we will share the list of invoices for which samples are required after receiving the purchase register from you."
   },
   {
    "n": 3,
    "text": "Supporting documents, if there are import purchases."
   }
  ]
 },
 {
  "id": "SAL",
  "title": "Salary",
  "items": [
   {
    "n": 1,
    "text": "Monthly payroll register for all 12 months."
   },
   {
    "n": 2,
    "text": "Payment proof for salary due as at the end of the financial year."
   },
   {
    "n": 3,
    "text": "Clarification of any variation between salary as per the books and MUDAD/GOSI."
   }
  ]
 },
 {
  "id": "RENT",
  "title": "Rent",
  "items": [
   {
    "n": 1,
    "text": "All Ejar contracts and payment copies covering the audit period."
   }
  ]
 },
 {
  "id": "EOSB",
  "title": "Employee end of service benefits (EOSB)",
  "items": [
   {
    "n": 1,
    "text": "EOSB schedule, if a provision is created in the trial balance provided."
   },
   {
    "n": 2,
    "text": "List of employees who resigned during the audit period, with their final settlement details."
   }
  ]
 },
 {
  "id": "EXP",
  "title": "Expenses other than salary and rent",
  "items": [
   {
    "n": 1,
    "text": "SOA/ledger statements of indirect expenses covering more than 50% of indirect expenses in value."
   },
   {
    "n": 2,
    "text": "Sample invoices covering more than 50% of the expenses in value from the above."
   },
   {
    "n": 3,
    "text": "If the number of samples is high when applying the above rule, we will share the list of samples after receiving the SOAs from you."
   }
  ]
 }
]
