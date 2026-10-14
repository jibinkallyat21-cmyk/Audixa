// Settings for the two auditing firms. The auditor chosen on the proposal decides
// which framework a file follows, so anything firm-specific is keyed by these ids.
// Legal names are confirmed by the audit lead and used by the EL verification checks.
export const FIRMS = {
  ABCPA: { id: 'ABCPA', legalName: 'Ashraf Bassas CPA Firm' },
  MISCPA: { id: 'MISCPA', legalName: 'MAAN Ibrahim Alshinkity CPA firm' },
}

export const FIRM_IDS = Object.keys(FIRMS)

// Rule Book 2.1 Step 1 lists four audit types; Agreed-Upon Procedures is kept by decision of the audit lead.
export const AUDIT_TYPES = ['Proper Audit', 'Disclaimer Audit', 'Liquidation Audit', 'Special Audit', 'Agreed-Upon Procedures']
