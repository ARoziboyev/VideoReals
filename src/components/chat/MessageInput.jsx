import { useEffect, useRef, useState } from 'react'
import { Paperclip, Smile, Mic, SendHorizontal, X, Pencil, Reply } from 'lucide-react'
import toast from 'react-hot-toast'
import EmojiPicker from './EmojiPicker'
import VoiceRecorder from './VoiceRecorder'
import { validateFile } from '../../services/storageService'
import { useT } from '../../lib/i18n'

export default function MessageInput({ onSendText, onSendFile, onSendVoice, onTyping, replyTo, onCancelReply, editing, onSaveEdit, onCancelEdit }) {
  const t = useT()
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState(false)
  const [recording, setRecording] = useState(false)
  const fileRef = useRef(null)
  const taRef = useRef(null)

  useEffect(() => { if (editing) { setText(editing.content || ''); taRef.current?.focus() } }, [editing?.id])
  useEffect(() => { if (replyTo) taRef.current?.focus() }, [replyTo?.id])
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }, [text])

  const submit = (e) => {
    e?.preventDefault()
    const v = text.trim()
    if (!v) return
    if (editing) onSaveEdit(v); else onSendText(v)
    setText(''); setEmoji(false)
  }

  const pickFile = (f) => {
    if (!f) return
    try { validateFile(f, 'chat-media') } catch (err) { toast.error(err.message); return }
    onSendFile(f)
  }

  return (
    <div className="border-t border-line p-3 glass-strong" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      {(replyTo || editing) && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-fg/5 px-3 py-2 text-xs">
          {editing ? <Pencil size={14} className="text-violet-400" /> : <Reply size={14} className="text-violet-400" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-violet-300">{editing ? 'Editing message' : 'Reply'}</p>
            <p className="truncate text-fg/60">{(editing || replyTo).content || `[${(editing || replyTo).message_type}]`}</p>
          </div>
          <button onClick={() => { editing ? onCancelEdit() : onCancelReply(); if (editing) setText('') }} aria-label="Cancel"><X size={16} /></button>
        </div>
      )}
      {emoji && <div className="mb-2"><EmojiPicker onPick={(e) => setText((v) => v + e)} /></div>}
      <form onSubmit={submit} className="flex items-end gap-1.5">
        {recording ? (
          <VoiceRecorder onCancel={() => setRecording(false)} onSend={(f, d) => { setRecording(false); onSendVoice(f, d) }} />
        ) : (
          <>
            <button type="button" className="icon-btn" onClick={() => setEmoji((v) => !v)} aria-label="Emoji"><Smile size={21} /></button>
            {!editing && <button type="button" className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Attach file"><Paperclip size={20} /></button>}
            <input ref={fileRef} type="file" hidden onChange={(e) => { pickFile(e.target.files[0]); e.target.value = '' }} />
            <textarea ref={taRef} rows={1} value={text} maxLength={4000}
              onChange={(e) => { setText(e.target.value); onTyping?.() }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder={t('typeMessage')} aria-label="Message"
              className="input thin-scroll max-h-36 min-h-[42px] flex-1 resize-none rounded-2xl py-2.5" />
            {text.trim() || editing ? (
              <button className="btn-primary h-[42px] w-[42px] shrink-0 rounded-full p-0" aria-label="Send"><SendHorizontal size={18} /></button>
            ) : (
              <button type="button" onClick={() => setRecording(true)} className="icon-btn h-[42px] w-[42px] rounded-full bg-fg/10" aria-label="Record voice message"><Mic size={20} /></button>
            )}
          </>
        )}
      </form>
    </div>
  )
}
