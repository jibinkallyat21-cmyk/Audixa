// Shared in-memory activity log — written by all client portal actions
// and read by the Activity Log screen and dashboard Recent Activity card.

let _events = [
  // ── FY2024 events ──
  { id: 'act-01', fy: 'FY2024', icon: 'emerald', description: 'Your bank statement (Oct 2024) was approved by your audit team', timestamp: '08 Oct 2024, 14:20', section: 'My Documents' },
  { id: 'act-02', fy: 'FY2024', icon: 'blue', description: 'You submitted Top 10 Customer Contracts — under review', timestamp: '09 Oct 2024, 10:14', section: 'My Documents' },
  { id: 'act-03', fy: 'FY2024', icon: 'amber', description: 'Q3 Bank Reconciliation is still needed — please upload', timestamp: '09 Oct 2024, 08:00', section: 'My Documents' },
  { id: 'act-04', fy: 'FY2024', icon: 'emerald', description: 'Fixed Asset Register was approved', timestamp: '05 Oct 2024, 09:02', section: 'My Documents' },
  { id: 'act-05', fy: 'FY2024', icon: 'red', description: 'Your ECL Provision Calculation was rejected — please re-upload with the correction', timestamp: '03 Oct 2024, 16:41', section: 'My Documents' },
  { id: 'act-06', fy: 'FY2024', icon: 'blue', description: 'Your auditor raised a question about Q3 Revenue Drop — SAR 450,000 entry', timestamp: '05 Oct 2024, 10:42', section: 'Auditor Questions' },
  { id: 'act-07', fy: 'FY2024', icon: 'emerald', description: 'Bank signatory question answered and closed', timestamp: '02 Oct 2024, 15:40', section: 'Auditor Questions' },
  { id: 'act-08', fy: 'FY2024', icon: 'navy', description: 'Audit progressed to stage: Audit in Progress', timestamp: '28 Sep 2024, 09:00', section: 'Milestones' },
  { id: 'act-09', fy: 'FY2024', icon: 'blue', description: 'Your auditor proposed adjustment ADJ-001 — awaiting your review', timestamp: '10 Oct 2024, 11:30', section: 'Working TB' },
  { id: 'act-10', fy: 'FY2024', icon: 'blue', description: 'Your auditor proposed adjustment ADJ-002 — awaiting your review', timestamp: '11 Oct 2024, 09:15', section: 'Working TB' },
  { id: 'act-11', fy: 'FY2024', icon: 'navy', description: 'Audit progressed to stage: Sending Your Documents', timestamp: '15 Sep 2024, 09:00', section: 'Milestones' },
  { id: 'act-12', fy: 'FY2024', icon: 'emerald', description: 'Corporate Governance documents category completed — all 12 documents approved', timestamp: '20 Sep 2024, 14:00', section: 'My Documents' },
  { id: 'act-13', fy: 'FY2024', icon: 'blue', description: 'You submitted ZATCA E-Invoicing samples — being checked', timestamp: '07 Oct 2024, 11:40', section: 'My Documents' },
  { id: 'act-14', fy: 'FY2024', icon: 'amber', description: 'Year-end Cutoff Invoices newly requested — please upload by 18 Oct 2024', timestamp: '03 Oct 2024, 08:00', section: 'My Documents' },
  { id: 'act-15', fy: 'FY2024', icon: 'emerald', description: 'Your Fixed Asset Disposal documentation was accepted and query closed', timestamp: '25 Sep 2024, 14:30', section: 'Auditor Questions' },
  { id: 'act-16', fy: 'FY2024', icon: 'navy', description: 'Your audit engagement was officially started — KSA-2024-8841', timestamp: '01 Aug 2024, 09:00', section: 'Milestones' },
  { id: 'act-17', fy: 'FY2024', icon: 'blue', description: 'Engagement letter issued by Analytix — please download from Reports & Documents', timestamp: '01 Aug 2024, 10:00', section: 'Reports & Documents' },
  { id: 'act-18', fy: 'FY2024', icon: 'blue', description: 'Trade License Renewal 2024 submitted for review', timestamp: '06 Oct 2024, 09:50', section: 'My Documents' },
  { id: 'act-19', fy: 'FY2024', icon: 'emerald', description: 'Trade License Renewal 2024 was approved', timestamp: '08 Oct 2024, 14:20', section: 'My Documents' },
  { id: 'act-20', fy: 'FY2024', icon: 'blue', description: 'Your auditor updated the working trial balance', timestamp: '09 Oct 2024, 09:15', section: 'Working TB' },

  // ── FY2023 events ──
  { id: 'fy23-01', fy: 'FY2023', icon: 'emerald', description: 'Audit completed — Final Signed AFS issued for FY2023', timestamp: '15 Jan 2024, 10:00', section: 'Milestones' },
  { id: 'fy23-02', fy: 'FY2023', icon: 'emerald', description: 'Audited Financial Statements filed with MISA — KSA-2023-7712', timestamp: '18 Jan 2024, 09:30', section: 'Reports & Documents' },
  { id: 'fy23-03', fy: 'FY2023', icon: 'emerald', description: 'Draft AFS reviewed and sign-off confirmed by authorised signatory', timestamp: '10 Jan 2024, 14:00', section: 'Reports & Documents' },
  { id: 'fy23-04', fy: 'FY2023', icon: 'navy', description: 'Partner sign-off completed — Ashraf Bassas CPA Firm', timestamp: '14 Jan 2024, 11:00', section: 'Milestones' },
  { id: 'fy23-05', fy: 'FY2023', icon: 'emerald', description: 'All 5 audit queries resolved and closed', timestamp: '20 Nov 2023, 15:00', section: 'Auditor Questions' },
  { id: 'fy23-06', fy: 'FY2023', icon: 'emerald', description: 'All 78 PBC requirement documents accepted', timestamp: '15 Nov 2023, 12:00', section: 'My Documents' },
  { id: 'fy23-07', fy: 'FY2023', icon: 'navy', description: 'Audit field work commenced — KSA-2023-7712', timestamp: '01 Oct 2023, 09:00', section: 'Milestones' },
  { id: 'fy23-08', fy: 'FY2023', icon: 'emerald', description: 'Trial balance accepted by audit team in prescribed format', timestamp: '05 Oct 2023, 11:00', section: 'Working TB' },
  { id: 'fy23-09', fy: 'FY2023', icon: 'blue', description: 'Engagement letter issued by Analytix for FY2023 statutory audit', timestamp: '01 Aug 2023, 10:00', section: 'Reports & Documents' },
  { id: 'fy23-10', fy: 'FY2023', icon: 'navy', description: 'FY2023 audit engagement officially started — KSA-2023-7712', timestamp: '01 Aug 2023, 09:00', section: 'Milestones' },

  // ── FY2022 events ──
  { id: 'fy22-01', fy: 'FY2022', icon: 'emerald', description: 'Audit completed — Final Signed AFS issued for FY2022', timestamp: '20 Jan 2023, 10:00', section: 'Milestones' },
  { id: 'fy22-02', fy: 'FY2022', icon: 'emerald', description: 'Audited Financial Statements filed with MISA — KSA-2022-6305', timestamp: '22 Jan 2023, 09:30', section: 'Reports & Documents' },
  { id: 'fy22-03', fy: 'FY2022', icon: 'emerald', description: 'Draft AFS sign-off confirmed by authorised signatory', timestamp: '12 Jan 2023, 14:00', section: 'Reports & Documents' },
  { id: 'fy22-04', fy: 'FY2022', icon: 'navy', description: 'Partner sign-off completed — Man Ibrahim Alshinqiti CPA Firm', timestamp: '18 Jan 2023, 11:00', section: 'Milestones' },
  { id: 'fy22-05', fy: 'FY2022', icon: 'emerald', description: 'All 3 audit queries resolved and closed', timestamp: '10 Dec 2022, 15:00', section: 'Auditor Questions' },
  { id: 'fy22-06', fy: 'FY2022', icon: 'emerald', description: 'All 71 PBC requirement documents accepted', timestamp: '05 Dec 2022, 12:00', section: 'My Documents' },
  { id: 'fy22-07', fy: 'FY2022', icon: 'navy', description: 'Audit field work commenced — KSA-2022-6305', timestamp: '01 Nov 2022, 09:00', section: 'Milestones' },
  { id: 'fy22-08', fy: 'FY2022', icon: 'emerald', description: 'Trial balance accepted by audit team in prescribed format', timestamp: '05 Nov 2022, 11:00', section: 'Working TB' },
  { id: 'fy22-09', fy: 'FY2022', icon: 'blue', description: 'Engagement letter issued by Man Ibrahim Alshinqiti CPA Firm for FY2022', timestamp: '01 Sep 2022, 10:00', section: 'Reports & Documents' },
  { id: 'fy22-10', fy: 'FY2022', icon: 'navy', description: 'FY2022 audit engagement officially started — KSA-2022-6305', timestamp: '01 Sep 2022, 09:00', section: 'Milestones' },
]

export function getActivityEvents(fy) {
  const all = [..._events]
  if (!fy) return all
  return all.filter((e) => e.fy === fy)
}

export function addActivityEvent(event) {
  _events = [event, ..._events]
}
