import { motion } from 'framer-motion'
import { Play, Pause, Music2, Trash2 } from 'lucide-react'
import { Equalizer } from './MiniPlayer'
import { useMusicStore, useCurrentTrack } from '../../store/musicStore'
import { cn, formatCount, formatDuration } from '../../lib/utils'

export function TrackCover({ track, size = 48, className = '' }) {
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-xl bg-fg/10', className)} style={{ width: size, height: size }}>
      {track.cover_url
        ? <img src={track.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        : <div className="grid h-full place-items-center text-white" style={{ backgroundImage: 'linear-gradient(135deg,#7C3AED,#2563EB 55%,#DB2777)' }}><Music2 size={size * 0.38} /></div>}
    </div>
  )
}

export default function TrackRow({ track, queue, index, onDelete, canDelete, onPick, picked }) {
  const current = useCurrentTrack()
  const { playing, playTrack, toggle } = useMusicStore()
  const isCurrent = current?.id === track.id
  const onPlay = () => (isCurrent ? toggle() : playTrack(track, queue))

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index ?? 0, 12) * 0.025 }}
      className={cn('group flex items-center gap-3 rounded-2xl px-2.5 py-2 transition hover:bg-fg/[0.06]', (isCurrent || picked) && 'bg-fg/[0.07]')}>
      <button onClick={onPlay} className="relative" aria-label={isCurrent && playing ? 'Pause' : 'Play'}>
        <TrackCover track={track} />
        <span className={cn('absolute inset-0 grid place-items-center rounded-xl bg-black/45 text-white transition',
          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
          {isCurrent && playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
        </span>
      </button>
      <button onClick={onPick || onPlay} className="min-w-0 flex-1 text-left">
        <p className={cn('flex items-center gap-2 truncate text-sm font-bold', isCurrent && 'text-violet-300')}>
          {track.title}{isCurrent && <Equalizer playing={playing} className="text-violet-400" />}
        </p>
        <p className="truncate text-xs text-fg/55">{track.artist}{track.profiles?.username && <span className="text-fg/35"> · @{track.profiles.username}</span>}</p>
      </button>
      <span className="hidden text-xs tabular-nums text-fg/40 sm:block">{formatCount(track.plays_count)} ▶</span>
      <span className="w-10 text-right text-xs tabular-nums text-fg/45">{formatDuration(track.duration)}</span>
      {canDelete && (
        <button onClick={() => onDelete(track)} className="icon-btn h-8 w-8 text-fg/40 opacity-0 hover:text-rose-400 group-hover:opacity-100 max-md:opacity-100" aria-label="Delete track">
          <Trash2 size={15} />
        </button>
      )}
    </motion.div>
  )
}