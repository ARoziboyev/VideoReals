import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, LogOut, Phone, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../../lib/supabase'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ForwardModal from './ForwardModal'
import { conversationMeta } from './ConversationList'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import * as ms from '../../services/messageService'
import { refreshUnreadCounts } from '../../hooks/useAppRealtime'
import { startCall } from '../../services/callService'
import { useT } from '../../lib/i18n'
import { errorMessage, lastSeenText } from '../../lib/utils'

function dayLabel(d) {
  const date = new Date(d)
  const today = new Date()
  const y = new Date(); y.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === y.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

export default function ChatWindow({ conversation, onBack, onLeft }) {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const onlineUsers = useUIStore((s) => s.onlineUsers)
  const cid = conversation.id
  const { title, avatar, other } = conversationMeta(conversation, me.id)
  const membersById = useMemo(() => Object.fromEntries((conversation.members || []).map((m) => [m.id, m])), [conversation.members])

  const [messages, setMessages] = useState([])
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [typing, setTyping] = useState({})
  const [replyTo, setReplyTo] = useState(null)
  const [editing, setEditing] = useState(null)
  const [forwarding, setForwarding] = useState(null)
  const listRef = useRef(null)
  const channelRef = useRef(null)
  const typingSentAt = useRef(0)
  const stickToBottom = useRef(true)

  const scrollToBottom = (smooth = false) => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  const markRead = useCallback(() => {
    ms.markRead(cid).then(() => refreshUnreadCounts(me.id)).catch(() => {})
  }, [cid, me.id])

  useEffect(() => {
    let alive = true
    setLoading(true); setMessages([]); setReactions([]); setReplyTo(null); setEditing(null); setTyping({}); stickToBottom.current = true
    Promise.all([ms.fetchMessages(cid), ms.fetchReactions(cid)]).then(([msgs, rx]) => {
      if (!alive) return
      setMessages(msgs); setReactions(rx); setHasMore(msgs.length === 50)
      markRead()
    }).catch((e) => toast.error(errorMessage(e))).finally(() => alive && setLoading(false))

    const typingTimers = {}
    const ch = supabase.channel(`conv-${cid}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${cid}` }, ({ new: m }) => {
        setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list.filter((x) => !(x.pending && x.tempKey && m.sender_id === me.id && x.tempMatch === m.message_type + (m.content || ''))), m]))
        if (m.sender_id !== me.id) {
          markRead()
          setTyping((t) => { const n = { ...t }; delete n[m.sender_id]; return n })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${cid}` }, ({ new: m }) => {
        setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, ...m } : x)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions', filter: `conversation_id=eq.${cid}` }, ({ new: r }) => {
        setReactions((list) => (list.some((x) => x.message_id === r.message_id && x.user_id === r.user_id && x.emoji === r.emoji) ? list : [...list, r]))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, ({ old }) => {
        setReactions((list) => list.filter((x) => !(x.message_id === old.message_id && x.user_id === old.user_id && x.emoji === old.emoji)))
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === me.id) return
        clearTimeout(typingTimers[payload.user_id])
        if (payload.typing) {
          setTyping((t) => ({ ...t, [payload.user_id]: payload.username }))
          typingTimers[payload.user_id] = setTimeout(() => setTyping((t) => { const n = { ...t }; delete n[payload.user_id]; return n }), 4000)
        } else setTyping((t) => { const n = { ...t }; delete n[payload.user_id]; return n })
      })
      .subscribe()
    channelRef.current = ch
    return () => { alive = false; Object.values(typingTimers).forEach(clearTimeout); supabase.removeChannel(ch) }
  }, [cid, me.id, markRead])

  useLayoutEffect(() => { if (stickToBottom.current) scrollToBottom() }, [messages.length, loading])

  const onScroll = async (e) => {
    const el = e.currentTarget
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (el.scrollTop < 60 && hasMore && !loading && messages.length) {
      setLoading(true)
      const prevHeight = el.scrollHeight
      try {
        const older = await ms.fetchMessages(cid, { before: messages[0].created_at })
        setHasMore(older.length === 50)
        setMessages((list) => [...older, ...list])
        requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight })
      } finally { setLoading(false) }
    }
  }

  const sendTyping = (isTyping = true) => {
    const now = Date.now()
    if (isTyping && now - typingSentAt.current < 2000) return
    typingSentAt.current = now
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: me.id, username: profile?.username, typing: isTyping } })
  }

  const send = async ({ content = '', file = null, type = 'text', duration = null }) => {
    const tempId = `temp-${crypto.randomUUID()}`
    const temp = { id: tempId, pending: true, tempKey: true, tempMatch: type + (content.trim() || ''), conversation_id: cid, sender_id: me.id, content: content.trim() || null, message_type: type, media_url: null, reply_to: replyTo?.id || null, created_at: new Date().toISOString() }
    stickToBottom.current = true
    setMessages((list) => [...list, temp])
    const reply = replyTo?.id || null
    setReplyTo(null)
    sendTyping(false)
    try {
      const saved = await ms.sendMessage({ conversationId: cid, senderId: me.id, receiverId: other?.id || null, content, type, file, duration, replyTo: reply })
      setMessages((list) => {
        const without = list.filter((x) => x.id !== tempId)
        return without.some((x) => x.id === saved.id) ? without : [...without, saved]
      })
    } catch (e) {
      setMessages((list) => list.filter((x) => x.id !== tempId))
      toast.error(type === 'text' ? 'Message not sent' : 'Upload failed')
      console.error(e)
    }
  }

  const saveEdit = async (content) => {
    const target = editing
    setEditing(null)
    try { const m = await ms.editMessage(target.id, content); setMessages((l) => l.map((x) => (x.id === m.id ? m : x))); toast.success('Message edited') }
    catch (e) { toast.error(errorMessage(e)) }
  }
  const remove = async (m) => {
    try { const d = await ms.deleteMessage(m); setMessages((l) => l.map((x) => (x.id === d.id ? d : x))); toast.success('Message deleted') }
    catch (e) { toast.error(errorMessage(e)) }
  }
  const react = async (m, emoji, active) => {
    setReactions((list) => active ? list.filter((r) => !(r.message_id === m.id && r.user_id === me.id && r.emoji === emoji)) : [...list, { message_id: m.id, user_id: me.id, emoji }])
    try { await ms.toggleReaction({ messageId: m.id, conversationId: cid, userId: me.id, emoji, active }) }
    catch (e) { toast.error(errorMessage(e)) }
  }
  const leave = async () => {
    if (!confirm('Leave this group?')) return
    try { await ms.leaveConversation(cid, me.id); toast.success('You left the group'); onLeft?.() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  const call = async (kind) => {
    if (!other) return
    try { await startCall({ peer: other, kind, conversationId: cid }) } catch (e) { toast.error(e.message) }
  }

  const byId = useMemo(() => Object.fromEntries(messages.map((m) => [m.id, m])), [messages])
  const typingNames = Object.values(typing)
  const status = typingNames.length
    ? `${conversation.is_group ? typingNames.join(', ') + ' is' : ''} typing…`.trim()
    : conversation.is_group ? `${conversation.members?.length || 0} members` : lastSeenText(other, other && onlineUsers.has(other.id))

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex items-center gap-3 border-b border-line px-3 py-2.5 glass" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <button className="icon-btn md:hidden" onClick={onBack} aria-label="Back"><ArrowLeft size={21} /></button>
        <Link to={other ? `/u/${other.username}` : '#'} className="flex min-w-0 flex-1 items-center gap-3">
          {conversation.is_group && !avatar
            ? <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white"><Users size={18} /></span>
            : <Avatar src={avatar} name={title} size={40} online={other ? onlineUsers.has(other.id) : false} />}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{title}</p>
            <p className={`truncate text-xs ${typingNames.length ? 'text-violet-400' : 'text-fg/50'}`}>{status}</p>
          </div>
        </Link>
        {!conversation.is_group && other && (
          <>
            <button className="icon-btn" onClick={() => call('audio')} aria-label={t('voiceCall')} title={t('voiceCall')}><Phone size={20} /></button>
            <button className="icon-btn" onClick={() => call('video')} aria-label={t('videoCall')} title={t('videoCall')}><Video size={21} /></button>
          </>
        )}
        {conversation.is_group && <button className="icon-btn" onClick={leave} aria-label="Leave group"><LogOut size={19} /></button>}
      </header>

      <div ref={listRef} onScroll={onScroll} className="thin-scroll flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-5">
        {loading && <div className="grid place-items-center py-3"><Spinner /></div>}
        {!loading && messages.length === 0 && <p className="py-16 text-center text-sm text-fg/50">Say hello 👋</p>}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
          const showSender = conversation.is_group && (!prev || prev.sender_id !== m.sender_id || newDay)
          return (
            <div key={m.id}>
              {newDay && <div className="my-3 flex justify-center"><span className="rounded-full px-3 py-1 text-[11px] font-semibold text-fg/60 glass">{dayLabel(m.created_at)}</span></div>}
              <MessageBubble m={m} mine={m.sender_id === me.id} meId={me.id}
                sender={membersById[m.sender_id]} showSender={conversation.is_group ? showSender : false}
                replied={m.reply_to ? byId[m.reply_to] : null}
                reactions={reactions.filter((r) => r.message_id === m.id)}
                onReply={setReplyTo} onEdit={(x) => { setReplyTo(null); setEditing(x) }} onDelete={remove}
                onCopy={(x) => { navigator.clipboard.writeText(x.content || ''); toast.success('Copied') }}
                onForward={setForwarding} onReact={react}
                onCallBack={!conversation.is_group && other ? call : undefined} />
            </div>
          )
        })}
      </div>

      <MessageInput
        onTyping={() => sendTyping(true)}
        onSendText={(content) => send({ content })}
        onSendFile={(file) => send({ file, type: ms.detectType(file) === 'voice' ? 'file' : ms.detectType(file) })}
        onSendVoice={(file, duration) => send({ file, type: 'voice', duration })}
        replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
        editing={editing} onSaveEdit={saveEdit} onCancelEdit={() => setEditing(null)} />
      <ForwardModal message={forwarding} onClose={() => setForwarding(null)} />
    </div>
  )
}