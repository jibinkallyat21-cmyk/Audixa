// Shared in-memory activity log — written by all client portal actions
// and read by the Activity Log screen and dashboard Recent Activity card.

let _events = [
  {
    id: 'act-01',
    icon: 'emerald',
    description: 'Your bank statement (Oct 2024) was approved by your audit team',
    timestamp: '08 Oct 2024, 14:20',
    section: 'My Documents',
  },
  {
    id: 'act-02',
    icon: 'blue',
    description: 'You submitted Top 10 Customer Contracts — under review',
    timestamp: '09 Oct 2024, 10:14',
    section: 'My Documents',
  },
  {
    id: 'act-03',
    icon: 'amber',
    description: 'Q3 Bank Reconciliation is still needed — please upload',
    timestamp: '09 Oct 2024, 08:00',
    section: 'My Documents',
  },
  {
    id: 'act-04',
    icon: 'emerald',
    description: 'Fixed Asset Register was approved',
    timestamp: '05 Oct 2024, 09:02',
    section: 'My Documents',
  },
  {
    id: 'act-05',
    icon: 'red',
    description: 'Your ECL Provision Calculation was rejected — please re-upload with the correction',
    timestamp: '03 Oct 2024, 16:41',
    section: 'My Documents',
  },
  {
    id: 'act-06',
    icon: 'blue',
    description: 'Your auditor raised a question about Q3 Revenue Drop — SAR 450,000 entry',
    timestamp: '05 Oct 2024, 10:42',
    section: 'Auditor Questions',
  },
  {
    id: 'act-07',
    icon: 'emerald',
    description: 'Bank signatory question answered and closed',
    timestamp: '02 Oct 2024, 15:40',
    section: 'Auditor Questions',
  },
  {
    id: 'act-08',
    icon: 'navy',
    description: 'Audit progressed to stage: Audit in Progress',
    timestamp: '28 Sep 2024, 09:00',
    section: 'Milestones',
  },
  {
    id: 'act-09',
    icon: 'blue',
    description: 'Your auditor proposed adjustment ADJ-001 — awaiting your review',
    timestamp: '10 Oct 2024, 11:30',
    section: 'Working TB',
  },
  {
    id: 'act-10',
    icon: 'blue',
    description: 'Your auditor proposed adjustment ADJ-002 — awaiting your review',
    timestamp: '11 Oct 2024, 09:15',
    section: 'Working TB',
  },
  {
    id: 'act-11',
    icon: 'navy',
    description: 'Audit progressed to stage: Sending Your Documents',
    timestamp: '15 Sep 2024, 09:00',
    section: 'Milestones',
  },
  {
    id: 'act-12',
    icon: 'emerald',
    description: 'Corporate Governance documents category completed — all 12 documents approved',
    timestamp: '20 Sep 2024, 14:00',
    section: 'My Documents',
  },
  {
    id: 'act-13',
    icon: 'blue',
    description: 'You submitted ZATCA E-Invoicing samples — being checked',
    timestamp: '07 Oct 2024, 11:40',
    section: 'My Documents',
  },
  {
    id: 'act-14',
    icon: 'amber',
    description: 'Year-end Cutoff Invoices newly requested — please upload by 18 Oct 2024',
    timestamp: '03 Oct 2024, 08:00',
    section: 'My Documents',
  },
  {
    id: 'act-15',
    icon: 'emerald',
    description: 'Your Fixed Asset Disposal documentation was accepted and query closed',
    timestamp: '25 Sep 2024, 14:30',
    section: 'Auditor Questions',
  },
  {
    id: 'act-16',
    icon: 'navy',
    description: 'Your audit engagement was officially started — KSA-2024-8841',
    timestamp: '01 Aug 2024, 09:00',
    section: 'Milestones',
  },
  {
    id: 'act-17',
    icon: 'blue',
    description: 'Engagement letter issued by Analytix — please download from Reports & Documents',
    timestamp: '01 Aug 2024, 10:00',
    section: 'Reports & Documents',
  },
  {
    id: 'act-18',
    icon: 'blue',
    description: 'Trade License Renewal 2024 submitted for review',
    timestamp: '06 Oct 2024, 09:50',
    section: 'My Documents',
  },
  {
    id: 'act-19',
    icon: 'emerald',
    description: 'Trade License Renewal 2024 was approved',
    timestamp: '08 Oct 2024, 14:20',
    section: 'My Documents',
  },
  {
    id: 'act-20',
    icon: 'blue',
    description: 'Your auditor updated the working trial balance',
    timestamp: '09 Oct 2024, 09:15',
    section: 'Working TB',
  },
]

export function getActivityEvents() {
  return [..._events]
}

export function addActivityEvent(event) {
  _events = [event, ..._events]
}
