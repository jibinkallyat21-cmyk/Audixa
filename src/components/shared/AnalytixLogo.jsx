export function AnalytixMark({ size = 22, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <path
        d="M50 8 C53.5 8 56.7 9.9 58.3 13 L85.5 76.5 C88.3 83 84 88 76.8 88 L23.2 88 C16 88 11.7 83 14.5 76.5 L41.7 13 C43.3 9.9 46.5 8 50 8 Z"
        fill="#E8323C"
      />
      <path
        d="M50 28 L65 49 L55 49 L55 60 C55 73 45 80 34 74 C44 70 46 61 46 50 L36 49 Z"
        fill="#F8FAFC"
      />
    </svg>
  )
}

export default function AnalytixLogo({ light = false, size = 'md', className = '' }) {
  const textSize = size === 'lg' ? 'text-sm' : size === 'sm' ? 'text-[10px]' : 'text-xs'
  const markSize = size === 'lg' ? 26 : size === 'sm' ? 16 : 20

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnalytixMark size={markSize} />
      <span
        className={`${textSize} font-bold tracking-[0.16em] ${light ? 'text-white' : 'text-[#0D1B2A]'}`}
      >
        ANALYTI<span className="text-brand-red">X</span>
      </span>
    </div>
  )
}
