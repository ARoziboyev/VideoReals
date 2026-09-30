import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack, X, Music2 } from 'lucide-react'
import { useMusicStore, useCurrentTrack } from '../../store/musicStore'
import { countPlay } from '../../services/musicService'
import { cn, formatDuration } from '../../lib/utils'

export function Equalizer({ playing, className = '' }) {
  return (
    <span className={cn('vm-eq inline-flex h-3.5 items-end gap-[2px]', !playing && 'paused', className)} aria-hidden="true">
      <span style={{ height: '100%' }} /><span style={{ height: '100%' }} /><span style={{ height: '100%' }} />
    </span>
  )
}

export default function MiniPlayer() {
  const { pathname } = useLocation()
  const track = useCurrentTrack()
  const { playing, toggle, next, prev, close, setPlaying, queue, index } = useMusicStore()
  const audio = useRef(null)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const hidden = /^\/live\/.+/.test(pathname) || /^\/messages\/.+/.test(pathname)

  useEffect(() => {
    const a = audio.current
    if (!a || !track) return
    a.src = track.audio_url
    setTime(0)
    if (useMusicStore.getState().playing) a.play().catch(() => setPlaying(false))
    countPlay(track.id).catch(() => {})
  }, [track?.id])

  useEffect(() => {
    const a = audio.current
    if (!a || !track) return
    if (playing) a.play().catch(() => setPlaying(false))
    else a.pause()
  }, [playing])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title, artist: track.artist, artwork: track.cover_url ? [{ src: track.cover_url, sizes: '512x512' }] : [],
    })
    navigator.mediaSession.setActionHandler('play', () => setPlaying(true))
    navigator.mediaSession.setActionHandler('pause', () => setPlaying(false))
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('previoustrack', prev)
  }, [track?.id])

  const seek = (e) => {
    const a = audio.current
    if (!a || !dur) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - r.left) / r.width) * dur
  }

  return (
    <>
      <audio ref={audio} preload="auto" onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)} onEnded={next} />
      <AnimatePresence>
        {track && !hidden && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))_+_4.75rem)] z-40 overflow-hidden rounded-2xl glass-strong md:inset-x-auto md:bottom-5 md:right-5 md:w-[22rem]">
            <div className="h-[3px] cursor-pointer bg-fg/10" onClick={seek}>
              <div className="h-full bg-gradient-to-r from-violet-400 via-sky-400 to-pink-400" style={{ width: `${dur ? (time / dur) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center gap-3 p-2.5">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-fg/10">
                {track.cover_url ? <img src={track.cover_url} alt="" className="h-full w-full object-cover" />
                  : <div className="grid h-full place-items-center bg-gradient-to-br from-violet-500 to-pink-500 text-white"><Music2 size={18} /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-bold">{track.title} <Equalizer playing={playing} className="text-violet-400" /></p>
                <p className="truncate text-xs text-fg/55">{track.artist} · {formatDuration(time)} / {formatDuration(dur)}</p>
              </div>
              <button className="icon-btn h-9 w-9" onClick={prev} disabled={index <= 0} aria-label="Previous"><SkipBack size={17} /></button>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-fg text-[rgb(var(--bg))] transition active:scale-90" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button className="icon-btn h-9 w-9" onClick={next} disabled={index >= queue.length - 1} aria-label="Next"><SkipForward size={17} /></button>
              <button className="icon-btn h-8 w-8" onClick={() => { audio.current?.pause(); close() }} aria-label="Close player"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}