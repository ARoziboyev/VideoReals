import { useEffect, useRef, useState } from 'react'
import { Music2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { uploadTrack } from '../../services/musicService'
import { validateFile } from '../../services/storageService'
import { useT } from '../../lib/i18n'
import { errorMessage, formatBytes } from '../../lib/utils'

export default function UploadTrackModal({ open, onClose, onUploaded }) {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [file, setFile] = useState(null)
  const [cover, setCover] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [rights, setRights] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  const coverRef = useRef(null)

  useEffect(() => {
    if (!open) { setFile(null); setCover(null); setCoverPreview(null); setTitle(''); setArtist(''); setRights(false) }
  }, [open])

  const pick = (f) => {
    if (!f) return
    try { validateFile(f, 'music') } catch (e) { toast.error(e.message); return }
    setFile(f)
    const base = f.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ')
    const [a, ...rest] = base.split(' - ')
    if (rest.length) { setArtist((v) => v || a.trim()); setTitle((v) => v || rest.join(' - ').trim()) }
    else setTitle((v) => v || base.trim())
  }
  const pickCover = (f) => {
    if (!f) return
    try { validateFile(f, 'images') } catch (e) { toast.error(e.message); return }
    setCover(f); setCoverPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file || busy) return
    setBusy(true)
    const id = toast.loading('Uploading…')
    try {
      const track = await uploadTrack({ userId: user.id, file, cover, title, artist })
      toast.success('Track published', { id })
      onUploaded?.(track); onClose()
    } catch (err) { toast.error(errorMessage(err), { id }) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={t('uploadMusic')} size="md">
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="flex gap-4">
          <button type="button" onClick={() => coverRef.current?.click()} className="glass-edge grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-fg/[0.05] text-fg/50 hover:bg-fg/10">
            {coverPreview ? <img src={coverPreview} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-xs font-semibold"><ImagePlus size={22} />Cover</span>}
          </button>
          <input ref={coverRef} type="file" hidden accept="image/*" onChange={(e) => { pickCover(e.target.files[0]); e.target.value = '' }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-4 text-center hover:border-violet-400/50">
            <Music2 size={26} className="text-violet-400" />
            {file ? <span className="text-sm font-semibold">{file.name}<span className="block text-xs text-fg/50">{formatBytes(file.size)}</span></span>
              : <span className="text-sm font-semibold">MP3, M4A, WAV, OGG<span className="block text-xs font-normal text-fg/50">up to 20 MB</span></span>}
          </button>
          <input ref={fileRef} type="file" hidden accept="audio/*" onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
        </div>
        <div><label className="label" htmlFor="tr-title">Title</label><input id="tr-title" required maxLength={120} className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="label" htmlFor="tr-artist">Artist</label><input id="tr-artist" required maxLength={120} className="input" value={artist} onChange={(e) => setArtist(e.target.value)} /></div>
        <label className="flex items-start gap-3 rounded-xl bg-fg/[0.04] p-3 text-xs text-fg/65">
          <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
          I own this track or have permission from the rights holder to share it publicly.
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary min-w-[120px]" disabled={!file || !rights || busy}>{busy ? <Spinner size={16} className="text-white" /> : 'Publish'}</button>
        </div>
      </form>
    </Modal>
  )
}