import { NavLink } from 'react-router-dom'
import { SquarePen, Users } from 'lucide-react'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useT } from '../../lib/i18n'
import { cn, fullName, timeAgo } from '../../lib/utils'

export function conversationMeta(conv, meId) {
  if (conv.is_group) return { title: conv.title || 'Group', avatar: conv.avatar_url, other: null }
  const other = (conv.members || []).find((m) => m.id !== meId) || (conv.members || [])[0]
  return { title: fullName(other) || other?.username || 'Chat', avatar: other?.avatar_url, other }
}

function preview(msg, meId) {
  if (!msg) return 'No messages yet'
  const prefix = msg.sender_id === meId ? 'You: ' : ''
  if (msg.is_deleted) return `${prefix}Deleted message`
  const labels = { image: '📷 Photo', video: '🎬 Video', voice: '🎤 Voice message', file: '📎 File' }
  return prefix + (msg.content || labels[msg.message_type] || '')
}

export default function ConversationList({ conversations, loading, onNewChat }) {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const onlineUsers = useUIStore((s) => s.onlineUsers)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h1 className="page-title">{t('messages')}</h1>
        <button className="icon-btn" onClick={onNewChat} aria-label={t('newChat')}><SquarePen size={21} /></button>
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto px-2 pb-28 md:pb-4">
        {loading ? <div className="grid py-12 place-items-center"><Spinner /></div>
          : conversations.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold">No conversations yet</p>
              <p className="mt-1 text-sm text-fg/55">Start a chat with someone you follow.</p>
              <button className="btn-primary mt-4" onClick={onNewChat}>{t('newChat')}</button>
            </div>
          ) : conversations.map((c) => {
            const { title, avatar, other } = conversationMeta(c, me.id)
            return (
              <NavLink key={c.id} to={`/messages/${c.id}`}
                className={({ isActive }) => cn('flex items-center gap-3 rounded-2xl px-3 py-2.5 transition', isActive ? 'bg-fg/10' : 'hover:bg-fg/5')}>
                {c.is_group && !avatar
                  ? <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white"><Users size={20} /></span>
                  : <Avatar src={avatar} name={title} size={48} online={other ? onlineUsers.has(other.id) : false} />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold">{title}</p>
                    <span className="shrink-0 text-[11px] text-fg/45">{timeAgo(c.last_message?.created_at || c.updated_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('truncate text-[13px]', c.unread_count ? 'font-semibold text-fg' : 'text-fg/55')}>{preview(c.last_message, me.id)}</p>
                    {c.unread_count > 0 && <span className="grid min-w-[20px] place-items-center rounded-full bg-violet-500 px-1.5 text-[11px] font-bold leading-5 text-white">{c.unread_count}</span>}
                  </div>
                </div>
              </NavLink>
            )
          })}
      </div>
    </div>
  )
}
