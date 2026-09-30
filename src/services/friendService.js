import supabase from '../lib/supabase'

const PROFILE = 'id,username,first_name,last_name,avatar_url'

export async function fetchFriends(userId) {
  const { data, error } = await supabase.from('close_friends').select(`created_at, friend:friend_id(${PROFILE})`)
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data.map((r) => r.friend).filter(Boolean)
}

export async function setFriends(userId, add = [], remove = []) {
  if (add.length) {
    const { error } = await supabase.from('close_friends')
      .upsert(add.map((friend_id) => ({ user_id: userId, friend_id })), { onConflict: 'user_id,friend_id', ignoreDuplicates: true })
    if (error) throw error
  }
  if (remove.length) {
    const { error } = await supabase.from('close_friends').delete().eq('user_id', userId).in('friend_id', remove)
    if (error) throw error
  }
}