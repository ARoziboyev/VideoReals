import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { NOTIFICATION_TYPES } from '../lib/notificationText'
import * as notificationService from '../services/notificationService'
import * as messageService from '../services/messageService'
import { setOnline } from '../services/profileService'

export async function refreshUnreadCounts(userId) {
  if (!userId) return
  const [n, convs] = await Promise.all([
    notificationService.unreadCount(userId).catch(() => 0),
    messageService.fetchConversations().catch(() => []),
  ])
  useUIStore.getState().setUnread({
    unreadNotifications: n,
    unreadMessages: convs.reduce((s, c) => s + (c.unread_count || 0), 0),
  })
}

export function useAppRealtime() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const location = useLocation()
  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname
  const showOnline = profile?.settings?.privacy?.show_online_status !== false

  // Notifications + incoming messages
  useEffect(() => {
    if (!user) return
    refreshUnreadCounts(user.id)
    messageService.markDelivered().catch(() => {})
    const ch = supabase.channel(`user-events-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, async ({ new: n }) => {
        if (n.type === 'message') return
        useUIStore.getState().incNotifications()
        const { data: s } = await supabase.from('profiles').select('username').eq('id', n.sender_id).maybeSingle()
        toast(`${s?.username ?? 'Someone'} ${NOTIFICATION_TYPES[n.type] || ''}`, { icon: '🔔' })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: m }) => {
        if (m.sender_id === user.id) return
        const path = pathRef.current
        const openId = path.startsWith('/messages/') ? path.split('/')[2] : null
        if (openId === m.conversation_id) return
        messageService.markDelivered(m.conversation_id).catch(() => {})
        useUIStore.getState().incMessages()
        if (!path.startsWith('/messages')) toast('New message', { icon: '💬' })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user?.id])

  // Online presence
  useEffect(() => {
    if (!user || !profile) return
    if (!showOnline) {
      setOnline(user.id, false, false)
      return
    }
    setOnline(user.id, true)
    const ch = supabase.channel('online-users', { config: { presence: { key: user.id } } })
    ch.on('presence', { event: 'sync' }, () => {
      useUIStore.getState().setOnlineUsers(new Set(Object.keys(ch.presenceState())))
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ online_at: new Date().toISOString() })
    })
    const onVisibility = () => setOnline(user.id, document.visibilityState === 'visible')
    const onHide = () => setOnline(user.id, false)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    const heartbeat = setInterval(() => document.visibilityState === 'visible' && setOnline(user.id, true), 60_000)
    return () => {
      clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
      supabase.removeChannel(ch)
      setOnline(user.id, false)
    }
  }, [user?.id, Boolean(profile), showOnline])
}
