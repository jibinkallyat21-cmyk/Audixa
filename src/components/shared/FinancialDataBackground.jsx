import { useMemo } from 'react'

// Ambient, out-of-focus ledger figures drifting behind the splash copy, plus
// a faint grid texture and soft glow blobs so the dark canvas reads as
// "quietly alive" rather than empty. Decorative only (aria-hidden) —
// respects the app-wide prefers-reduced-motion override in index.css, which
// collapses all animation-duration to ~0.
const SAMPLE_STRINGS = [
  '1,284,391.02',
  '+18.4%',
  'SAR 42.8M',
  '99.98%',
  'Q4 FY2024',
  '890,204.55',
  '-2.1%',
  '76,205,000',
  '+4.7%',
  'SAR 1.24M',
  '54,000',
  '17%',
  '2,148',
  '92.9%',
  '4,410.28',
  '+9.2%',
  'SAR 890K',
  '148',
  '06:42:18',
  '+21.6%',
  '1.9M',
  '38,204',
  '99.1%',
  '325',
  'SAR 8.5K',
  '+3.4%',
]

function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

export default function FinancialDataBackground() {
  const particles = useMemo(() => {
    const rand = seededRandom(42)
    return SAMPLE_STRINGS.map((text, i) => ({
      text,
      top: 3 + rand() * 94,
      left: 3 + rand() * 94,
      size: 12 + Math.floor(rand() * 16),
      blur: 0.5 + rand() * 1.8,
      opacity: 0.06 + rand() * 0.09,
      duration: 14 + rand() * 14,
      delay: -1 * (rand() * 20),
      drift: 22 + rand() * 34,
      key: i,
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Faint digital grid for texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Soft ambient glow blobs to give the canvas depth instead of flat black */}
      <div className="animate-glow-pulse absolute -bottom-24 -left-24 h-[420px] w-[420px] rounded-full bg-brand/10 blur-3xl" />
      <div
        className="animate-glow-pulse absolute -right-24 -top-16 h-[460px] w-[460px] rounded-full bg-amber/10 blur-3xl"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="animate-glow-pulse absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl"
        style={{ animationDelay: '1s' }}
      />

      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute font-mono font-medium text-white"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            filter: `blur(${p.blur}px)`,
            animation: `audixaDataDrift ${p.duration}s ease-in-out ${p.delay}s infinite`,
            '--drift-y': `${p.drift}px`,
          }}
        >
          {p.text}
        </span>
      ))}
    </div>
  )
}
