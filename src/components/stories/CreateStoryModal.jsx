import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Type } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import AudiencePicker from '../common/AudiencePicker'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { createStory } from '../../services/storyService'
import { validateFile } from '../../services/storageService'
import { useT } from '../../lib/i18n'
import { cn, errorMessage } from '../../lib/utils'

const BACKGROUNDS = [
  'linear-gradient(135deg,#8B5CF6,#EC4899)',
  'linear-gradient(135deg,#4F7CFF,#8B5CF6)',
  'linear-gradient(160deg,#0F172A,#4F7CFF)',
  'linear-gradient(135deg,#F43F5E,#F59E0B)',
  'linear-gradient(135deg,#10B981,#4F7CFF)',
  'linear-gradient(135deg,#111827,#374151)',
]

export default function CreateStoryModal() {
  const t = useT()
  const { storyOpen, setStoryOpen } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const [mode, setMode] = useState('media')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [text, setText] = useState('')
  const [bg, setBg] = useState(BACKGROUNDS[0])
  const [busy, setBusy] = useState(false)
  const [visibility, setVisibility] = useState('public')
  const ref = useRef(null)

  useEffect(() => {
    if (!storyOpen) { if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); setText(''); setMode('media'); setVisibility('public') }
  }, [storyOpen])

  const pick = (f) => {
    if (!f) return
    try { validateFile(f, 'stories') } catch (e) { toast.error(e.message); return }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  const canSubmit = mode === 'text' ? text.trim().length > 0 : Boolean(file)
  const submit = async () => {
    if (!canSubmit || busy) return
    setBusy(true)
    try {
      const mediaType = mode === 'text' ? 'text' : file.type.startsWith('video/') ? 'video' : 'image'
      await createStory({ userId: user.id, file, mediaType, text, background: mode === 'text' ? bg : null, visibility })
      toast.success('Story shared')
      window.dispatchEvent(new Event('vm:story-created'))
      setStoryOpen(false)
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={storyOpen} onClose={() => !busy && setStoryOpen(false)} title={t('createStory')} size="sm">
      <div className="p-4">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-fg/5 p-1">
          {[['media', ImagePlus, 'Photo / video'], ['text', Type, 'Text']].map(([m, Icon, label]) => (
            <button key={m} onClick={() => setMode(m)} className={cn('flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition', mode === m ? 'bg-fg/10 text-fg' : 'text-fg/55')}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {mode === 'media' ? (
          <>
            <button onClick={() => ref.current?.click()} className="relative flex aspect-[9/14] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-fg/[0.03]">
              {preview ? (file.type.startsWith('video/')
                ? <video src={preview} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                : <img src={preview} alt="" className="h-full w-full object-cover" />)
                : <span className="flex flex-col items-center gap-2 text-sm font-semibold text-fg/60"><ImagePlus size={30} className="text-pink-400" />Choose a photo or video</span>}
            </button>
            <input ref={ref} type="file" hidden accept="image/*,video/*" onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Add a caption (optional)" className="input mt-3" />
          </>
        ) : (
          <>
            <div className="grid aspect-[9/14] place-items-center rounded-2xl p-6" style={{ background: bg }}>
              <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={5} autoFocus
                placeholder="Type your story" className="w-full resize-none bg-transparent text-center font-display text-xl font-semibold text-white outline-none placeholder:text-white/60" />
            </div>
            <div className="mt-3 flex gap-2">
              {BACKGROUNDS.map((b) => (
                <button key={b} onClick={() => setBg(b)} aria-label="Background" style={{ background: b }}
                  className={cn('h-8 w-8 rounded-full ring-offset-2 ring-offset-[rgb(var(--bg))]', bg === b && 'ring-2 ring-white')} />
              ))}
            </div>
          </>
        )}
        <div className="mt-4"><AudiencePicker value={visibility} onChange={setVisibility} /></div>
        <button className="btn-primary mt-4 w-full" disabled={!canSubmit || busy} onClick={submit}>
          {busy ? <><Spinner size={16} className="text-white" /> Sharing</> : 'Share story'}
        </button>
      </div>
    </Modal>
  )
}