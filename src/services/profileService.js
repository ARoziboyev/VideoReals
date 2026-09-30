import supabase from '../lib/supabase'
import { uploadFile, removeByUrl, dataUrlToFile } from './storageService'
import { getPendingAvatar, clearPendingAvatar } from './authService'
import { sanitizeSearch } from '../lib/utils'

export async function getProfileByUsername(username) {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId, patch) {
  const clean = { ...patch }
  if (clean.username) {
    clean.username = clean.username.trim().toLowerCase()
    if (!/^[a-z0-9_.]{3,30}$/.test(clean.username)) throw new Error('Username: 3–30 characters, letters, numbers, _ and . only')
  }
  const { data, error } = await supabase.from('profiles').update(clean).eq('id', userId).select().single()
  if (error) throw error.code === '23505' ? new Error('This username is already taken') : error
  return data
}

export async function uploadAvatar(userId, file, oldUrl) {
  const url = await uploadFile('avatars', file, userId)
  const profile = await updateProfile(userId, { avatar_url: url })
  if (oldUrl) removeByUrl(oldUrl, 'avatars').catch(() => {})
  return profile
}

export async function updateSettings(profile, patch) {
  const cur = profile.settings || {}
  const next = { ...cur }
  for (const [k, v] of Object.entries(patch)) next[k] = typeof v === 'object' && v !== null ? { ...(cur[k] || {}), ...v } : v
  return updateProfile(profile.id, { settings: next })
}

export async function setOnline(userId, online, touchLastSeen = true) {
  if (!userId) return
  const patch = { is_online: online }
  if (touchLastSeen) patch.last_seen = new Date().toISOString()
  await supabase.from('profiles').update(patch).eq('id', userId)
}

export async function searchUsers(q, limit = 20) {
  const s = sanitizeSearch(q)
  if (!s) return []
  const { data, error } = await supabase.from('profiles')
    .select('id,username,first_name,last_name,avatar_url,followers_count')
    .or(`username.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%`)
    .order('followers_count', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function suggestedUsers(userId, limit = 8) {
  const { data: following } = await supabase.from('followers').select('following_id').eq('follower_id', userId)
  const exclude = new Set([userId, ...(following || []).map((f) => f.following_id)])
  const { data } = await supabase.from('profiles')
    .select('id,username,first_name,last_name,avatar_url,followers_count')
    .order('followers_count', { ascending: false }).limit(40)
  return (data || []).filter((p) => !exclude.has(p.id)).slice(0, limit)
}

export async function applyPendingAvatar(user) {
  const pending = getPendingAvatar(user?.email)
  if (!pending) return null
  try {
    const file = dataUrlToFile(pending.dataUrl, 'avatar.jpg')
    const profile = await uploadAvatar(user.id, file)
    clearPendingAvatar()
    return profile
  } catch { return null }
}

export async function uploadCover(userId, file, oldUrl) {
  const url = await uploadFile('images', file, userId)
  const profile = await updateProfile(userId, { cover_url: url })
  if (oldUrl) removeByUrl(oldUrl, 'images').catch(() => {})
  return profile
}

export async function isUsernameAvailable(username, selfId) {
  const { data } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle()
  return !data || data.id === selfId
}