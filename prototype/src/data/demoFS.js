// Demo data for 3.6. Fictitious company; the TB balances, the PY AFS agrees to the opening except for one deliberate difference.
const L = (code, name, opening, debit, credit) => ({ code, name, opening, debit, credit, closing: opening + debit - credit, closingSupplied: true, group: undefined })
export const demoClientTB = () => [
  L('1001', 'Cash at bank - Al Rajhi', 52000, 850000, 618000), L('1002', 'Petty cash', 3000, 12000, 11500), L('1100', 'Trade receivables', 180000, 820000, 770000), L('1101', 'Customer - Faisal Est (credit balance)', -4000, 0, 3500),
  L('1200', 'Inventory - closing stock', 90000, 0, 0), L('1300', 'Prepaid insurance', 6000, 9000, 8000), L('1400', 'Input VAT', 21000, 98000, 94000), L('1500', 'Furniture and fixtures', 60000, 15000, 0), L('1501', 'Accumulated depreciation - furniture', -24000, 0, 9500),
  L('1600', 'Partner current account - Mr Ahmed', 45000, 0, 20000), L('2001', 'Trade payables', -140000, 520000, 560000), L('2002', 'Supplier - Gulf Parts (debit balance)', 2500, 3000, 1000), L('2100', 'Accrued expenses', -22000, 22000, 31000), L('2200', 'Output VAT', -38000, 80000, 118000),
  L('2300', 'End of service benefits provision', -48000, 4000, 16000), L('3001', 'Share capital', -100000, 0, 0), L('3002', 'Retained earnings', -83500, 0, 0),
  L('4001', 'Sales - local', 0, 5000, 990000), L('5001', 'Opening stock', 0, 0, 0), L('5002', 'Local purchases', 0, 540000, 5000), L('5003', 'Freight and customs', 0, 25000, 0),
  L('6001', 'Salaries and wages', 0, 168000, 0), L('6002', 'Rent expense', 0, 48000, 0), L('6003', 'Bank charges', 0, 1800, 0), L('6004', 'Advertising', 0, 14000, 0), L('6005', 'Depreciation expense', 0, 9500, 0), L('6006', 'Utilities', 0, 11200, 0),
].map((l, i, all) => ({ ...l }))
export const demoPYAFS = { bs: { cash: 55000, ar: 176000, inventory: 90000, prepaid: 6000, tangible: 35500, relRecCur: 45000, ap: 137500, accrued: 39000, eosb: 48000, capital: 100000, re: 83000 }, pl: {} }
export const demoBIS = [['Cash and bank', 24000, 'Dr'], ['Trade receivables', 61000, 'Dr'], ['Inventory', 30000, 'Dr'], ['Furniture and equipment', 18000, 'Dr'], ['Trade payables', 41000, 'Cr'], ['Share capital', 50000, 'Cr'], ['Sales', 220000, 'Cr'], ['Purchases', 120000, 'Dr'], ['Salaries', 36000, 'Dr'], ['Rent expense', 12000, 'Dr']]
