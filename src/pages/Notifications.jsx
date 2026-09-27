import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Radio, Reply, CheckCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import Avatar from '../components/common/Avatar'
import EmptyState from '../components/common/EmptyState'
import { PageLoader } from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import * as ns from '../services/notificationService'
import { NOTIFICATION_TYPES, notificationLink } from '../lib/notificationText'
import { useT } from '../lib/i18n'
import { cn, errorMessage, fullName, timeAgo } from '../lib/utils'

const ICONS = { follow: [UserPlus, '#4F7CFF'], like: [Heart, '#EC4899'], comment: [MessageCircle, '#8B5CF6'], reply: [Reply, '#8B5CF6'], mention: [AtSign, '#38BDF8'], message: [MessageCircle, '#22C55E'], story_like: [Heart, '#F43F5E'], live: [Radio, '#F43F5E'] }

export default function Notifications() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState(null)

  useEffect(() => {
    ns.fetchNotifications(user.id).then((data) => {
      setItems(data)
      if (data.some((n) => !n.is_read)) ns.markAllRead(user.id).then(() => useUIStore.getState().setUnread({ unreadNotifications: 0 })).catch(() => {})
    }).catch((e) => { toast.error(errorMessage(e)); setItems([]) })

    const ch = supabase.channel('notifications-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, async ({ new: n }) => {
        const { data: sender } = await supabase.from('profiles').select('id,username,first_name,last_name,avatar_url').eq('id', n.sender_id).maybeSingle()
        setItems((list) => [{ ...n, sender }, ...(list || [])])
        ns.markAllRead(user.id).then(() => useUIStore.getState().setUnread({ unreadNotifications: 0 })).catch(() => {})
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user.id])

  const remove = async (id) => {
    setItems((l) => l.filter((n) => n.id !== id))
    try { await ns.deleteNotification(id) } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-5 sm:px-5">
      <div className="mb-4 flex items-center justify-between px-1">
        <h1 className="page-title">{t('notifications')}</h1>
        {items?.length > 0 && <button className="btn-ghost py-2 text-xs" onClick={() => ns.markAllRead(user.id).then(() => setItems((l) => l.map((n) => ({ ...n, is_read: true }))))}><CheckCheck size={15} />{t('markAllRead')}</button>}
      </div>
      {!items ? <PageLoader /> : items.length === 0 ? <EmptyState icon={Bell} title="No notifications yet" text="Likes, comments, follows and mentions show up here." /> : (
        <div className="glass-card divide-y divide-line overflow-hidden">
          {items.map((n) => {
            const [Icon, color] = ICONS[n.type] || [Bell, '#8B5CF6']
            return (
              <div key={n.id} className={cn('group flex items-center gap-3 px-4 py-3 transition hover:bg-fg/5', !n.is_read && 'bg-violet-500/[0.07]')}>
                <Link to={notificationLink(n, n.sender)} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative">
                    <Avatar src={n.sender?.avatar_url} name={fullName(n.sender)} size={44} />
                    <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[rgb(var(--bg))]" style={{ background: color }}><Icon size={10} className="text-white" /></span>
                  </div>
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-bold">{n.sender?.username || 'Someone'}</span> {NOTIFICATION_TYPES[n.type]}
                    <span className="ml-1.5 text-fg/45">{timeAgo(n.created_at)}</span>
                  </p>
                  {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400" />}
                </Link>
                <button onClick={() => remove(n.id)} className="icon-btn h-8 w-8 opacity-0 group-hover:opacity-100 max-md:opacity-60" aria-label="Delete notification"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
