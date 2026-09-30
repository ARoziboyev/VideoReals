import { useEffect, useRef, useState } from 'react'
import { UploadCloud, ImagePlus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import AudiencePicker from '../common/AudiencePicker'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { createPost } from '../../services/videoService'
import { validateFile, captureVideoThumbnail } from '../../services/storageService'
import { useT } from '../../lib/i18n'
import { errorMessage, formatBytes, parseHashtags } from '../../lib/utils'

export default function UploadPostModal() {
  const t = useT()
  const { uploadType, setUploadType } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [thumb, setThumb] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const thumbRef = useRef(null)
  const isVideo = uploadType === 'video'
  const bucket = isVideo ? 'videos' : 'images'

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview)
    if (thumbPreview) URL.revokeObjectURL(thumbPreview)
    setFile(null); setPreview(null); setThumb(null); setThumbPreview(null); setCaption(''); setError(''); setVisibility('public')
  }
  useEffect(() => { if (!uploadType) reset() }, [uploadType])

  const pick = async (f) => {
    if (!f) return
    setError('')
    try { validateFile(f, bucket) } catch (e) { setError(e.message); return }
    const keep = visibility
    reset()
    setVisibility(keep)
    setFile(f); setPreview(URL.createObjectURL(f))
    if (f.type.startsWith('video/')) {
      const th = await captureVideoThumbnail(f)
      if (th) { setThumb(th); setThumbPreview(URL.createObjectURL(th)) }
    }
  }

  const pickThumb = (f) => {
    if (!f) return
    try { validateFile(f, 'thumbnails') } catch (e) { toast.error(e.message); return }
    if (thumbPreview) URL.revokeObjectURL(thumbPreview)
    setThumb(f); setThumbPreview(URL.createObjectURL(f))
  }

  const submit = async () => {
    if (!file || busy) return
    setBusy(true); setError('')
    const id = toast.loading('Uploading…')
    try {
      const post = await createPost({ userId: user.id, file, thumbnail: isVideo ? thumb : null, caption, mediaType: uploadType, visibility })
      toast.success('Post published', { id })
      window.dispatchEvent(new CustomEvent('vm:post-created', { detail: post }))
      setUploadType(null)
    } catch (e) {
      toast.error('Upload failed', { id }); setError(errorMessage(e))
    } finally { setBusy(false) }
  }

  const tags = parseHashtags(caption)

  return (
    <Modal open={Boolean(uploadType)} onClose={() => !busy && setUploadType(null)} title={isVideo ? t('uploadVideo') : t('uploadImage')} size="lg">
      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,260px)_1fr]">
        <div>
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl bg-black">
              {isVideo ? <video src={preview} controls playsInline className="aspect-[9/16] w-full object-contain" />
                : <img src={preview} alt="Preview" className="aspect-[4/5] w-full object-contain" />}
              <button onClick={() => fileRef.current?.click()} className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <RefreshCw size={13} /> Change
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
              className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-fg/[0.03] p-6 text-center transition hover:border-violet-400/50 hover:bg-fg/[0.06]">
              <UploadCloud size={36} className="text-violet-400" />
              <span className="text-sm font-bold">Select or drop a {isVideo ? 'video' : 'photo'}</span>
              <span className="text-xs text-fg/50">{isVideo ? 'MP4, WebM or MOV · up to 50 MB' : 'JPG, PNG, WebP · up to 15 MB'}</span>
            </button>
          )}
          <input ref={fileRef} type="file" hidden accept={isVideo ? 'video/*' : 'image/*'} onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
        </div>

        <div className="flex flex-col gap-4">
          {file && <p className="truncate text-xs text-fg/50">{file.name} · {formatBytes(file.size)}</p>}
          <div>
            <label className="label" htmlFor="caption">Caption</label>
            <textarea id="caption" rows={5} maxLength={2200} value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Say something about it. Use #hashtags and @mentions" className="input resize-none" />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {tags.map((tg) => <span key={tg} className="rounded-full bg-sky-400/10 px-2 py-0.5 text-xs font-semibold text-sky-400">#{tg}</span>)}
              <span className="ml-auto text-xs text-fg/40">{caption.length}/2200</span>
            </div>
          </div>
          {isVideo && file && (
            <div>
              <span className="label">Thumbnail</span>
              <div className="flex items-center gap-3">
                <div className="h-24 w-16 overflow-hidden rounded-xl bg-fg/5">{thumbPreview && <img src={thumbPreview} alt="Thumbnail" className="h-full w-full object-cover" />}</div>
                <button className="btn-ghost" onClick={() => thumbRef.current?.click()}><ImagePlus size={16} /> Choose image</button>
                <input ref={thumbRef} type="file" hidden accept="image/*" onChange={(e) => { pickThumb(e.target.files[0]); e.target.value = '' }} />
              </div>
            </div>
          )}
          <AudiencePicker value={visibility} onChange={setVisibility} />
          {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}
          <div className="mt-auto flex justify-end gap-2">
            <button className="btn-ghost" disabled={busy} onClick={() => setUploadType(null)}>Cancel</button>
            <button className="btn-primary min-w-[120px]" disabled={!file || busy} onClick={submit}>
              {busy ? <><Spinner size={16} className="text-white" /> Uploading</> : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}