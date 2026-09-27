import supabase from '../lib/supabase'

export async function fetchNotifications(userId) {
  const { data, error } = await supabase.from('notifications')
    .select('*, sender:sender_id(id,username,first_name,last_name,avatar_url)')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  return data
}

export async function unreadCount(userId) {
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false)
  return count || 0
}

export async function markAllRead(userId) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  if (error) throw error
}

export async function deleteNotification(id) {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}
