import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import ConversationList from '../components/chat/ConversationList'
import ChatWindow from '../components/chat/ChatWindow'
import NewChatModal from '../components/chat/NewChatModal'
import EmptyState from '../components/common/EmptyState'
import { PageLoader } from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { fetchConversations } from '../services/messageService'
import { useT } from '../lib/i18n'
import { errorMessage } from '../lib/utils'

export default function Messages() {
  const t = useT()
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [convs, setConvs] = useState([])
  const [loading, setLoading] = useState(true)
  const [newChat, setNewChat] = useState(false)
  const reloadTimer = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchConversations()
      setConvs(data)
      useUIStore.getState().setUnread({ unreadMessages: data.reduce((s, c) => s + (c.unread_count || 0), 0) })
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setLoading(false) }
  }, [])

  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current)
    reloadTimer.current = setTimeout(load, 400)
  }, [load])

  useEffect(() => {
    load()
    const ch = supabase.channel('conversation-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members', filter: `user_id=eq.${user.id}` }, scheduleReload)
      .subscribe()
    return () => { clearTimeout(reloadTimer.current); supabase.removeChannel(ch) }
  }, [user.id, load, scheduleReload])

  useEffect(() => { if (id) scheduleReload() }, [id])

  const active = convs.find((c) => c.id === id)

  return (
    <div className="flex h-[100dvh]">
      <div className={`${id ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-line md:w-[340px] md:shrink-0 lg:w-[380px]`}>
        <ConversationList conversations={convs} loading={loading} onNewChat={() => setNewChat(true)} />
      </div>
      <div className={`${id ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
        {id ? (active ? <ChatWindow key={active.id} conversation={active} onBack={() => navigate('/messages')} onLeft={() => { navigate('/messages'); load() }} />
          : loading ? <PageLoader /> : <EmptyState icon={MessageCircle} title="Conversation not found" action={<button className="btn-ghost" onClick={() => navigate('/messages')}>Back to messages</button>} />)
          : <div className="grid h-full place-items-center"><EmptyState icon={MessageCircle} title="Your messages" text="Pick a conversation or start a new one." action={<button className="btn-primary" onClick={() => setNewChat(true)}>{t('newChat')}</button>} /></div>}
      </div>
      <NewChatModal open={newChat} onClose={() => setNewChat(false)} />
    </div>
  )
}
