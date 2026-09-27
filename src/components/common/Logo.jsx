export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="vm-logo-g" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset=".55" stopColor="#4F7CFF" /><stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path d="M18 6h28c6.6 0 12 5.4 12 12v20c0 6.6-5.4 12-12 12H26l-11 8.5c-1.3 1-3 .1-3-1.5V49.2C8.4 47.2 6 43.4 6 39V18C6 11.4 11.4 6 18 6z" fill="url(#vm-logo-g)" />
      <path d="M27 20.5v17c0 1.2 1.3 1.9 2.3 1.3l13.4-8.5c.9-.6.9-2 0-2.6l-13.4-8.5c-1-.6-2.3.1-2.3 1.3z" fill="#fff" />
    </svg>
  )
}

export default function Logo({ size = 34, showText = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && <span className="font-display text-[1.15rem] font-semibold tracking-tight">Video<span className="text-fg/55">Move</span></span>}
    </span>
  )
}
