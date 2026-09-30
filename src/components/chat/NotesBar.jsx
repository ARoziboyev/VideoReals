import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Music2, Trash2, Play, Pause, SendHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../../lib/supabase'
import Avatar from '../common/Avatar'
import Modal from '../common/Modal'
import CreateNoteModal from './CreateNoteModal'
import { TrackCover } from '../music/TrackRow'
import { useAuthStore } from '../../store/authStore'
import { useMusicStore, useCurrentTrack } from '../../store/musicStore'
import { fetchNotes, deleteNote } from '../../services/noteService'
import { getFollowingSet } from '../../services/followService'
import { getOrCreateDM, sendMessage } from '../../services/messageService'
import { useT } from '../../lib/i18n'
import { cn, errorMessage, fullName, timeAgo } from '../../lib/utils'

function Bubble({ note, placeholder }) {
  return (
    <div className="absolute -top-2 left-1/2 z-10 w-[5.6rem] -translate-x-1/2 -translate-y-full">
      <div className="relative rounded-2xl px-2 py-1.5 text-center glass-strong">
        {note?.media_url && <img src={note.media_url} alt="" className="mx-auto mb-1 h-8 w-8 rounded-md object-cover" />}
        {note?.track && <p className="flex items-center justify-center gap-1 truncate text-[10px] font-bold text-violet-300"><Music2 size={10} className="shrink-0" /><span className="truncate">{note.track.title}</span></p>}
        {(note?.text || placeholder) && <p className={cn('line-clamp-2 text-[11px] font-semibold leading-tight', placeholder && 'text-fg/45')}>{note?.text || placeholder}</p>}
        <span className="absolute -bottom-1 left-6 h-2 w-2 rounded-full border border-line bg-[rgb(var(--bg))]" />
      </div>
    </div>
  )
}

function NoteViewer({ note, onClose, onDeleted }) {
  const me = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const current = useCurrentTrack()
  const { playing, playTrack, toggle } = useMusicStore()
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  if (!note) return null
  const own = note.user_id === me.id
  const trackActive = note.track && current?.id === note.track.id

  const send = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setBusy(true)
    try {
      const cid = await getOrCreateDM(note.user_id)
      await sendMessage({ conversationId: cid, senderId: me.id, receiverId: note.user_id, content: reply, meta: { note_text: note.text || (note.track ? `♪ ${note.track.title}` : 'GIF') } })
      toast.success('Reply sent'); onClose(); navigate(`/messages/${cid}`)
    } catch (err) { toast.error(errorMessage(err)) }
    finally { setBusy(false) }
  }
  const remove = async () => {
    try { await deleteNote(note.id); toast.success('Note deleted'); onDeleted(note.id); onClose() }
    catch (err) { toast.error(errorMessage(err)) }
  }

  return (
    <Modal open onClose={onClose} title={note.profiles?.username} size="sm">
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="relative max-w-[17rem] rounded-[1.6rem] px-5 py-4 text-center glass-strong">
          {note.media_url && <img src={note.media_url} alt="" className="mx-auto mb-3 max-h-48 rounded-2xl" />}
          {note.text && <p className="text-base font-semibold">{note.text}</p>}
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-line bg-[rgb(var(--bg))]" />
        </div>
        <Avatar src={note.profiles?.avatar_url} name={fullName(note.profiles)} size={72} />
        <p className="-mt-2 text-xs text-fg/45">{timeAgo(note.created_at)} ago{note.visibility === 'friends' && ' · Friends'}</p>
        {note.track && (
          <button onClick={() => (trackActive ? toggle() : playTrack(note.track))} className="flex w-full items-center gap-3 rounded-2xl bg-fg/[0.06] p-2.5 text-left hover:bg-fg/10">
            <TrackCover track={note.track} size={44} />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{note.track.title}</span><span className="block truncate text-xs text-fg/55">{note.track.artist}</span></span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-fg text-[rgb(var(--bg))]">{trackActive && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}</span>
          </button>
        )}
        {own ? (
          <button className="btn-danger w-full" onClick={remove}><Trash2 size={16} />Delete note</button>
        ) : (
          <form onSubmit={send} className="flex w-full gap-2">
            <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${note.profiles?.username}…`} className="input flex-1 rounded-full" maxLength={500} />
            <button disabled={busy || !reply.trim()} className="btn-primary h-11 w-11 rounded-full p-0" aria-label="Send reply"><SendHorizontal size={17} /></button>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default function NotesBar() {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [notes, setNotes] = useState([])
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState(null)

  const load = useCallback(async () => {
    try {
      const all = await fetchNotes()
      const following = await getFollowingSet(me.id, [...new Set(all.map((n) => n.user_id))])
      all.sort((a, b) => Number(following.has(b.user_id)) - Number(following.has(a.user_id)))
      setNotes(all)
    } catch { /* notes are optional */ }
  }, [me.id])

  useEffect(() => {
    load()
    const ch = supabase.channel('notes-feed').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const mine = notes.find((n) => n.user_id === me.id)
  const others = notes.filter((n) => n.user_id !== me.id)

  return (
    <>
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-4 pb-3 pt-16">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => (mine ? setViewing(mine) : setCreating(true))} className="relative flex w-[5.6rem] shrink-0 flex-col items-center">
          <Bubble note={mine} placeholder={mine ? null : 'Note…'} />
          <div className="relative">
            <Avatar src={profile?.avatar_url} name={fullName(profile)} size={64} />
            {!mine && <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-[rgb(var(--bg))] bg-fg text-[rgb(var(--bg))]"><Plus size={13} strokeWidth={3} /></span>}
          </div>
          <span className="mt-1.5 w-full truncate text-center text-[11px] text-fg/55">{t('yourNote')}</span>
        </motion.button>
        {others.map((n, i) => (
          <motion.button key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.95 }} onClick={() => setViewing(n)} className="relative flex w-[5.6rem] shrink-0 flex-col items-center">
            <Bubble note={n} />
            <Avatar src={n.profiles?.avatar_url} name={fullName(n.profiles)} size={64} ring={n.visibility === 'friends' ? 'friends' : null} />
            <span className="mt-1.5 w-full truncate text-center text-[11px] text-fg/70">{n.profiles?.username}</span>
          </motion.button>
        ))}
      </div>
      <CreateNoteModal open={creating} onClose={() => setCreating(false)} onCreated={load} />
      {viewing && <NoteViewer note={viewing} onClose={() => setViewing(null)} onDeleted={(id) => setNotes((l) => l.filter((x) => x.id !== id))} />}
    </>
  )
}