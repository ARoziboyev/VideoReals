import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { formatDuration } from '../../lib/utils'

export default function AudioPlayer({ src, duration = 0, light = false }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [total, setTotal] = useState(duration)
  useEffect(() => { setTotal(duration) }, [duration])

  const toggle = () => {
    const a = ref.current
    if (!a) return
    a.paused ? a.play() : a.pause()
  }
  const seek = (e) => {
    const a = ref.current
    if (!a || !total) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - r.left) / r.width) * total
  }
  const pct = total ? Math.min(100, (time / total) * 100) : 0

  return (
    <div className="flex w-56 max-w-full items-center gap-3 py-1">
      <audio ref={ref} src={src || undefined} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setTime(0) }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setTotal(e.currentTarget.duration)} />
      <button type="button" onClick={toggle} disabled={!src} aria-label={playing ? 'Pause' : 'Play'}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${light ? 'bg-white text-violet-600' : 'bg-violet-500 text-white'}`}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1.5 cursor-pointer rounded-full bg-current/20" style={{ background: 'rgba(255,255,255,.25)' }} onClick={seek}>
          <div className="h-full rounded-full bg-current" style={{ width: `${pct}%` }} />
        </div>
        <span className="mt-1 block text-[11px] opacity-70">{formatDuration(playing || time ? time : total)}</span>
      </div>
    </div>
  )
}
