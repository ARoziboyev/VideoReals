import { cn } from '../../lib/utils'

export default function Avatar({ src, name = '', size = 40, online = false, ring = null, className = '' }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
  const inner = src
    ? <img src={src} alt="" loading="lazy" className="h-full w-full rounded-full object-cover" />
    : <div className="grid h-full w-full place-items-center rounded-full font-bold text-white"
        style={{ fontSize: size * 0.36, backgroundImage: 'linear-gradient(135deg,#8B5CF6,#4F7CFF 60%,#EC4899)' }}>{initials}</div>
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      {ring ? (
        <div className={cn('h-full w-full rounded-full p-[2.5px]', ring === 'seen' ? 'bg-fg/20' : ring === 'friends' ? 'friends-ring' : 'gradient-ring')}>
          <div className="h-full w-full rounded-full bg-base p-[2px]">{inner}</div>
        </div>
      ) : inner}
      {online && (
        <span className="absolute bottom-0 right-0 rounded-full border-2 border-[rgb(var(--bg))] bg-emerald-400"
          style={{ width: Math.max(10, size * 0.26), height: Math.max(10, size * 0.26) }} />
      )}
    </div>
  )
}