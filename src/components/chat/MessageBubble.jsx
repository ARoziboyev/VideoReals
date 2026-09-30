import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, CheckCheck, ChevronDown, Reply, Pencil, Copy, Forward, Trash2, FileText, Download, Clock, Phone, PhoneMissed, Video, StickyNote } from 'lucide-react'
import Avatar from '../common/Avatar'
import AudioPlayer from './AudioPlayer'
import { QUICK_REACTIONS } from './EmojiPicker'
import { useSignedUrl } from '../../hooks/useSignedUrl'
import { bucketFor } from '../../services/messageService'
import { clockTime, cn, formatBytes, formatDuration, fullName } from '../../lib/utils'

function Media({ m, mine }) {
  const { url, error } = useSignedUrl(bucketFor(m.message_type), m.media_url)
  if (m.pending) return <div className="grid h-40 w-56 place-items-center rounded-xl bg-black/20 text-xs opacity-70">Uploading…</div>
  if (error) return <p className="text-xs opacity-70">File unavailable</p>
  if (m.message_type === 'image') return url
    ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={m.file_name || 'Image'} className="max-h-72 w-full max-w-xs rounded-xl object-cover" /></a>
    : <div className="h-48 w-56 animate-pulse rounded-xl bg-black/20" />
  if (m.message_type === 'video') return url
    ? <video src={url} controls playsInline className="max-h-72 w-full max-w-xs rounded-xl bg-black" />
    : <div className="h-48 w-56 animate-pulse rounded-xl bg-black/20" />
  if (m.message_type === 'voice') return <AudioPlayer src={url} duration={m.duration} light={mine} />
  return (
    <a href={url || undefined} download={m.file_name} target="_blank" rel="noreferrer" className="flex w-60 max-w-full items-center gap-3 rounded-xl bg-black/15 p-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15"><FileText size={20} /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{m.file_name || 'File'}</span><span className="text-xs opacity-70">{formatBytes(m.file_size || 0)}</span></span>
      <Download size={17} className="opacity-80" />
    </a>
  )
}

function Status({ m }) {
  if (m.pending) return <Clock size={13} className="opacity-70" />
  if (m.read_at) return <CheckCheck size={15} className="text-sky-300" />
  if (m.delivered_at) return <CheckCheck size={15} className="opacity-75" />
  return <Check size={15} className="opacity-75" />
}

function CallLog({ m, mine, onCallBack }) {
  const video = m.meta?.kind === 'video'
  const status = m.meta?.status
  const missed = status !== 'completed'
  const Icon = missed ? PhoneMissed : video ? Video : Phone
  const label = missed ? (mine ? (status === 'declined' ? 'Call declined' : 'No answer') : 'Missed call') : (video ? 'Video call' : 'Voice call')
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', mine ? 'justify-end' : 'justify-start pl-9')}>
      <div className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 glass">
        <span className={cn('grid h-10 w-10 place-items-center rounded-full', missed ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400')}><Icon size={18} /></span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-fg/50">{clockTime(m.created_at)}{!missed && ` · ${formatDuration(m.meta?.duration)}`}</p>
        </div>
        {onCallBack && <button onClick={() => onCallBack(video ? 'video' : 'audio')} className="ml-2 rounded-full bg-fg/10 px-3 py-1.5 text-xs font-bold hover:bg-fg/15">Call back</button>}
      </div>
    </motion.div>
  )
}

export default function MessageBubble({ m, mine, sender, showSender, replied, reactions = [], meId, onReply, onEdit, onDelete, onCopy, onForward, onReact, onCallBack }) {
  const [menu, setMenu] = useState(false)
  if (m.message_type === 'call') return <CallLog m={m} mine={mine} onCallBack={onCallBack} />
  const grouped = Object.entries(reactions.reduce((acc, r) => { (acc[r.emoji] ||= []).push(r.user_id); return acc }, {}))
  const deleted = m.is_deleted

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}
      className={cn('group flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {!mine && showSender && <Avatar src={sender?.avatar_url} name={fullName(sender)} size={28} />}
      {!mine && !showSender && <span className="w-7 shrink-0" />}
      <div className={cn('relative flex max-w-[80%] flex-col sm:max-w-[65%]', mine ? 'items-end' : 'items-start')}>
        {!mine && showSender && sender && <span className="mb-0.5 ml-3 text-xs font-semibold text-violet-300">{sender.username}</span>}
        <div className={cn('relative rounded-2xl px-3.5 py-2 text-[14.5px] leading-relaxed shadow-sm',
          mine ? 'rounded-br-md text-white' : 'rounded-bl-md glass',
          deleted && 'opacity-60')}
          style={mine ? { backgroundImage: 'linear-gradient(135deg,#7C4DFF,#4F7CFF)' } : undefined}>
          {m.forwarded && !deleted && <p className="mb-1 flex items-center gap-1 text-[11px] italic opacity-75"><Forward size={11} /> Forwarded</p>}
          {m.meta?.note_text && !deleted && (
            <div className={cn('mb-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs', mine ? 'bg-white/15' : 'bg-fg/5')}>
              <StickyNote size={12} className="shrink-0 opacity-75" /><span className="line-clamp-1 opacity-85">{mine ? 'Replied to a note' : 'Replied to your note'}: “{m.meta.note_text}”</span>
            </div>
          )}
          {replied && !deleted && (
            <div className={cn('mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs', mine ? 'border-white/70 bg-white/15' : 'border-violet-400 bg-fg/5')}>
              <p className="line-clamp-2 opacity-85">{replied.is_deleted ? 'Deleted message' : replied.content || `[${replied.message_type}]`}</p>
            </div>
          )}
          {deleted ? <p className="italic">This message was deleted</p> : (
            <>
              {m.media_url || m.pending ? <div className="mb-1"><Media m={m} mine={mine} /></div> : null}
              {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
            </>
          )}
          <span className={cn('mt-0.5 flex items-center justify-end gap-1 text-[10.5px]', mine ? 'text-white/75' : 'text-fg/45')}>
            {m.edited_at && !deleted && 'edited ·'} {clockTime(m.created_at)} {mine && !deleted && <Status m={m} />}
          </span>
          {!deleted && !m.pending && (
            <button onClick={() => setMenu((v) => !v)} aria-label="Message actions"
              className={cn('absolute top-1 grid h-6 w-6 place-items-center rounded-full bg-black/25 text-white transition md:opacity-0 md:group-hover:opacity-100',
                mine ? '-left-8' : '-right-8')}>
              <ChevronDown size={14} />
            </button>
          )}
        </div>
        {grouped.length > 0 && (
          <div className="-mt-1.5 flex flex-wrap gap-1 px-1">
            {grouped.map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReact(m, emoji, users.includes(meId))}
                className={cn('flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs glass-strong', users.includes(meId) ? 'border-violet-400/70' : 'border-line')}>
                {emoji}{users.length > 1 && <span className="font-semibold">{users.length}</span>}
              </button>
            ))}
          </div>
        )}
        {menu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
            <div className={cn('absolute top-full z-40 mt-1 w-52 overflow-hidden rounded-2xl glass-strong shadow-glass', mine ? 'right-0' : 'left-0')}>
              <div className="flex justify-between border-b border-line px-2 py-2">
                {QUICK_REACTIONS.map((e) => {
                  const active = reactions.some((r) => r.emoji === e && r.user_id === meId)
                  return <button key={e} onClick={() => { onReact(m, e, active); setMenu(false) }} className={cn('grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-fg/10', active && 'bg-fg/15')}>{e}</button>
                })}
              </div>
              {[
                [Reply, 'Reply', () => onReply(m)],
                m.content && [Copy, 'Copy', () => onCopy(m)],
                [Forward, 'Forward', () => onForward(m)],
                mine && m.message_type === 'text' && [Pencil, 'Edit', () => onEdit(m)],
                mine && [Trash2, 'Delete', () => onDelete(m), true],
              ].filter(Boolean).map(([Icon, label, fn, danger]) => (
                <button key={label} onClick={() => { fn(); setMenu(false) }}
                  className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-fg/5', danger && 'text-rose-400')}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}