const AUDITOR_STYLES = {
  ABCPA: 'bg-navy/10 text-navy border-navy/30',
  MISCPA: 'bg-amber/10 text-amber border-amber/30',
}

export default function AuditorChip({ auditor }) {
  const style = AUDITOR_STYLES[auditor] || 'bg-gray-100 text-gray-600 border-gray-300'

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${style}`}
    >
      {auditor}
    </span>
  )
}
