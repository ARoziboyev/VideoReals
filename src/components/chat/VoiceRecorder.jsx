import { useEffect, useRef, useState } from 'react'
import { Square, Trash2, SendHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import AudioPlayer from './AudioPlayer'
import { formatDuration } from '../../lib/utils'

const MAX_SECONDS = 300

export default function VoiceRecorder({ onSend, onCancel }) {
  const [state, setState] = useState('starting') // starting | recording | recorded
  const [seconds, setSeconds] = useState(0)
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState(null)
  const recRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const secRef = useRef(0)

  const stopTracks = () => streamRef.current?.getTracks().forEach((t) => t.stop())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || ''
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
        const chunks = []
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
        rec.onstop = () => {
          const type = (rec.mimeType || 'audio/webm').split(';')[0]
          const blob = new Blob(chunks, { type })
          const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
          const f = new File([blob], `voice-${Date.now()}.${ext}`, { type })
          setFile(f); setUrl(URL.createObjectURL(blob)); setState('recorded')
          stopTracks()
        }
        rec.start(250)
        recRef.current = rec
        setState('recording')
        timerRef.current = setInterval(() => {
          secRef.current += 1; setSeconds(secRef.current)
          if (secRef.current >= MAX_SECONDS) stop()
        }, 1000)
      } catch {
        toast.error('Microphone access was denied')
        onCancel()
      }
    })()
    return () => { cancelled = true; clearInterval(timerRef.current); if (recRef.current?.state === 'recording') recRef.current.stop(); stopTracks() }
  }, [])

  useEffect(() => () => url && URL.revokeObjectURL(url), [url])

  function stop() {
    clearInterval(timerRef.current)
    if (recRef.current?.state === 'recording') recRef.current.stop()
  }
  const cancel = () => { stop(); onCancel() }

  return (
    <div className="flex flex-1 items-center gap-2 rounded-2xl bg-fg/5 px-2 py-1.5">
      <button type="button" onClick={cancel} className="icon-btn text-rose-400" aria-label="Cancel recording"><Trash2 size={19} /></button>
      {state === 'recorded' ? (
        <div className="flex-1 text-fg"><AudioPlayer src={url} duration={seconds} /></div>
      ) : (
        <div className="flex flex-1 items-center gap-2 text-sm font-semibold">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
          {state === 'starting' ? 'Starting microphone…' : `Recording ${formatDuration(seconds)}`}
        </div>
      )}
      {state === 'recording' && <button type="button" onClick={stop} className="icon-btn" aria-label="Stop recording"><Square size={17} fill="currentColor" /></button>}
      {state === 'recorded' && (
        <button type="button" onClick={() => onSend(file, seconds)} className="btn-primary h-10 w-10 rounded-full p-0" aria-label="Send voice message"><SendHorizontal size={17} /></button>
      )}
    </div>
  )
}
