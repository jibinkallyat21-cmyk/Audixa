let markIdCounter = 0

export function AnalytixMark({ size = 22, className = '' }) {
  const id = `analytix-mark-${++markIdCounter}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <mask id={id} maskUnits="userSpaceOnUse">
        {/* Rounded-corner upward triangle */}
        <path
          d="M50 8 C53.5 8 56.7 9.9 58.3 13 L85.5 76.5 C88.3 83 84 88 76.8 88 L23.2 88 C16 88 11.7 83 14.5 76.5 L41.7 13 C43.3 9.9 46.5 8 50 8 Z"
          fill="white"
        />
        {/* Upward-pointing arrow cutout: apex at top, stem going down */}
        <path
          d="M50 24 L66 50 L57 50 L57 70 L43 70 L43 50 L34 50 Z"
          fill="black"
        />
      </mask>
      {/* Transparent cutout: arrow is a hole in the triangle, blends on any bg */}
      <rect x="0" y="0" width="100" height="100" fill="#E8323C" mask={`url(#${id})`} />
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
        AUDIT <span className="text-brand">360</span>
      </span>
    </div>
  )
}
