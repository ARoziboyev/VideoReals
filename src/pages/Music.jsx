import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Upload, Music2, Play, Pause, Flame, Clock3 } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import TrackRow, { TrackCover } from '../components/music/TrackRow'
import UploadTrackModal from '../components/music/UploadTrackModal'
import EmptyState from '../components/common/EmptyState'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'
import { useMusicStore, useCurrentTrack } from '../store/musicStore'
import { fetchTracks, deleteTrack } from '../services/musicService'
import { useT } from '../lib/i18n'
import { cn, errorMessage, formatCount } from '../lib/utils'

function TopCard({ track, queue, i }) {
  const current = useCurrentTrack()
  const { playing, playTrack, toggle } = useMusicStore()
  const active = current?.id === track.id
  return (
    <motion.button initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      onClick={() => (active ? toggle() : playTrack(track, queue))}
      className="group w-40 shrink-0 text-left sm:w-44">
      <div className="relative">
        <TrackCover track={track} size={176} className="!h-40 !w-40 rounded-2xl shadow-glass sm:!h-44 sm:!w-44" />
        <span className="absolute bottom-2 right-2 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-white text-slate-900 opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          {active && playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </span>
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">#{i + 1}</span>
      </div>
      <p className={cn('mt-2.5 truncate text-sm font-bold', active && 'text-violet-300')}>{track.title}</p>
      <p className="truncate text-xs text-fg/55">{track.artist} · {formatCount(track.plays_count)} plays</p>
    </motion.button>
  )
}

export default function Music() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState(null)
  const [top, setTop] = useState([])
  const [upload, setUpload] = useState(false)

  const loadTop = () => fetchTracks({ order: 'top', limit: 12 }).then(setTop).catch(() => {})
  useEffect(() => { loadTop() }, [])

  useEffect(() => {
    let alive = true
    setTracks(null)
    const timer = setTimeout(() => {
      fetchTracks({ q, limit: 100 }).then((d) => alive && setTracks(d)).catch((e) => { toast.error(errorMessage(e)); alive && setTracks([]) })
    }, q ? 280 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [q])

  useEffect(() => {
    const ch = supabase.channel('music-library')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tracks' }, () => { if (!q) fetchTracks({ limit: 100 }).then(setTracks).catch(() => {}) })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [q])

  const remove = async (track) => {
    if (!confirm(`Delete “${track.title}”?`)) return
    try { await deleteTrack(track); setTracks((l) => l.filter((x) => x.id !== track.id)); setTop((l) => l.filter((x) => x.id !== track.id)); toast.success('Track deleted') }
    catch (e) { toast.error(errorMessage(e)) }
  }

  const list = useMemo(() => tracks || [], [tracks])

  return (
    <div className="mx-auto max-w-5xl px-3 pb-10 pt-5 sm:px-6">
      {/* hero */}
      <section className="glass-card overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: 'radial-gradient(circle,#DB2777,transparent 65%)' }} />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: 'radial-gradient(circle,#2563EB,transparent 65%)' }} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="chip bg-fg/10 text-fg/70"><Music2 size={13} /> VideoMove Music</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t('music')}</h1>
            <p className="mt-1.5 max-w-md text-sm text-fg/60">Tracks shared by the community. Tap to play — it keeps going while you browse.</p>
          </div>
          <button className="btn-primary self-start sm:self-auto" onClick={() => setUpload(true)}><Upload size={17} />{t('uploadMusic')}</button>
        </div>
        <div className="relative mt-6">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchMusic')} aria-label={t('searchMusic')}
            className="input rounded-2xl py-3.5 pl-11 pr-11 text-base" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/50" aria-label="Clear"><X size={18} /></button>}
        </div>
      </section>

      {!q && top.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 px-1 font-display text-lg font-semibold"><Flame size={19} className="text-orange-400" />Top</h2>
          <div className="scrollbar-none -mx-3 flex gap-4 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:px-6">
            {top.map((tr, i) => <TopCard key={tr.id} track={tr} queue={top} i={i} />)}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 px-1 font-display text-lg font-semibold">
          {q ? <><Search size={18} className="text-sky-400" />Results</> : <><Clock3 size={18} className="text-sky-400" />New</>}
        </h2>
        <div className="glass-card p-2">
          {!tracks ? <div className="grid py-12 place-items-center"><Spinner /></div>
            : list.length === 0 ? (
              <EmptyState icon={Music2} title={q ? 'Nothing found' : 'No music yet'}
                text={q ? 'Try another song or artist name.' : 'Be the first to share a track.'}
                action={!q && <button className="btn-primary" onClick={() => setUpload(true)}>{t('uploadMusic')}</button>} />
            ) : list.map((tr, i) => (
              <TrackRow key={tr.id} track={tr} queue={list} index={i} canDelete={tr.user_id === user.id} onDelete={remove} />
            ))}
        </div>
      </section>

      <UploadTrackModal open={upload} onClose={() => setUpload(false)} onUploaded={(tr) => { setTracks((l) => [tr, ...(l || [])]); loadTop() }} />
    </div>
  )
}