import { useEffect, useState } from 'react'
import { Music2, ImagePlus, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import AudiencePicker from '../common/AudiencePicker'
import GifPicker from './GifPicker'
import TrackRow, { TrackCover } from '../music/TrackRow'
import { useAuthStore } from '../../store/authStore'
import { createNote } from '../../services/noteService'
import { fetchTracks } from '../../services/musicService'
import { useT } from '../../lib/i18n'
import { cn, errorMessage, fullName } from '../../lib/utils'

export default function CreateNoteModal({ open, onClose, onCreated }) {
  const t = useT()
  const profile = useAuthStore((s) => s.profile)
  const [text, setText] = useState('')
  const [track, setTrack] = useState(null)
  const [file, setFile] = useState(null)
  const [gifUrl, setGifUrl] = useState(null)
  const [preview, setPreview] = useState(null)
  const [panel, setPanel] = useState(null) // music | media | null
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState([])
  const [visibility, setVisibility] = useState('public')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) { setText(''); setTrack(null); setFile(null); setGifUrl(null); setPreview(null); setPanel(null); setQ(''); setVisibility('public') }
  }, [open])

  useEffect(() => {
    if (panel !== 'music') return
    const timer = setTimeout(() => fetchTracks({ q, limit: 30 }).then(setTracks).catch(() => setTracks([])), 250)
    return () => clearTimeout(timer)
  }, [panel, q])

  const clearMedia = () => { setFile(null); setGifUrl(null); setPreview(null) }
  const canPost = text.trim() || track || file || gifUrl

  const submit = async () => {
    if (!canPost || busy) return
    setBusy(true)
    try {
      const note = await createNote({ userId: profile.id, text, trackId: track?.id, file, gifUrl, visibility })
      toast.success('Note shared')
      onCreated?.(note); onClose()
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={t('notes')} size="sm">
      <div className="space-y-4 p-5">
        {/* live preview */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative mb-2 max-w-[15rem] rounded-[1.4rem] px-4 py-3 text-center glass-strong">
            {preview && <img src={preview} alt="" className="mx-auto mb-2 max-h-28 rounded-xl" />}
            {track && <p className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-300"><Music2 size={12} />{track.title} · {track.artist}</p>}
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} rows={2} autoFocus placeholder="Share a thought…"
              className="w-full resize-none bg-transparent text-center text-sm font-semibold outline-none placeholder:text-fg/40" />
            <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-line bg-[rgb(var(--bg))]" />
          </div>
          <Avatar src={profile?.avatar_url} name={fullName(profile)} size={64} />
          <span className="mt-1 text-xs text-fg/40">{text.length}/60</span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setPanel(panel === 'music' ? null : 'music')} className={cn('btn flex-1 border', panel === 'music' || track ? 'border-violet-400/60 bg-violet-500/15' : 'border-line hover:bg-fg/5')}><Music2 size={16} />{t('music')}</button>
          <button onClick={() => setPanel(panel === 'media' ? null : 'media')} className={cn('btn flex-1 border', panel === 'media' || preview ? 'border-pink-400/60 bg-pink-500/15' : 'border-line hover:bg-fg/5')}><ImagePlus size={16} />GIF / Photo</button>
        </div>

        {track && (
          <div className="flex items-center gap-3 rounded-2xl bg-fg/[0.05] p-2">
            <TrackCover track={track} size={40} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{track.title}</p><p className="truncate text-xs text-fg/50">{track.artist}</p></div>
            <button className="icon-btn h-8 w-8" onClick={() => setTrack(null)} aria-label="Remove song"><X size={15} /></button>
          </div>
        )}
        {preview && <button className="btn-ghost w-full py-2 text-xs" onClick={clearMedia}><X size={14} />Remove image</button>}

        {panel === 'music' && (
          <div className="rounded-2xl bg-fg/[0.03] p-2">
            <div className="relative mb-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg/45" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchMusic')} className="input py-2 pl-9" />
            </div>
            <div className="thin-scroll max-h-56 overflow-y-auto">
              {tracks.length === 0 ? <p className="py-6 text-center text-xs text-fg/50">No tracks found</p>
                : tracks.map((tr, i) => <TrackRow key={tr.id} track={tr} queue={tracks} index={i} picked={track?.id === tr.id} onPick={() => { setTrack(tr); setPanel(null) }} />)}
            </div>
          </div>
        )}
        {panel === 'media' && (
          <GifPicker
            onPickUrl={(url) => { setFile(null); setGifUrl(url); setPreview(url); setPanel(null) }}
            onPickFile={(f) => { setGifUrl(null); setFile(f); setPreview(URL.createObjectURL(f)); setPanel(null) }} />
        )}

        <AudiencePicker value={visibility} onChange={setVisibility} />
        <button className="btn-primary w-full" disabled={!canPost || busy} onClick={submit}>{busy ? <Spinner size={16} className="text-white" /> : 'Share note'}</button>
        <p className="text-center text-xs text-fg/40">Notes disappear after 24 hours. Sharing a new note replaces the old one.</p>
      </div>
    </Modal>
  )
}