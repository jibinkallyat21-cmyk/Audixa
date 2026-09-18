const AUDIT_TYPE_STYLES = {
  'Proper Audit': 'bg-blue-100 text-blue-700 border-blue-300',
  Disclaimer: 'bg-gray-100 text-gray-600 border-gray-300',
  'Special Audit': 'bg-purple-100 text-purple-700 border-purple-300',
  'Liquidation—Proper': 'bg-amber/10 text-amber border-amber/30',
  'Liquidation—Disclaimer': 'bg-alert-red/10 text-alert-red border-alert-red/30',
}

export default function AuditTypeChip({ type }) {
  const style = AUDIT_TYPE_STYLES[type] || 'bg-gray-100 text-gray-600 border-gray-300'

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${style}`}
    >
      {type}
    </span>
  )
}
