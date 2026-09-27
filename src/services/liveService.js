import supabase from '../lib/supabase'

const HOST = 'profiles:host_id(id,username,first_name,last_name,avatar_url)'

export async function fetchActiveStreams() {
  const { data, error } = await supabase.from('live_streams').select(`*, ${HOST}`).eq('is_active', true).order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchStream(id) {
  const { data, error } = await supabase.from('live_streams').select(`*, ${HOST}`).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function startStream(hostId, title) {
  // Close any stale stream of this host first
  await supabase.from('live_streams').update({ is_active: false, ended_at: new Date().toISOString() }).eq('host_id', hostId).eq('is_active', true)
  const { data, error } = await supabase.from('live_streams').insert({ host_id: hostId, title: title.trim() }).select(`*, ${HOST}`).single()
  if (error) throw error
  return data
}

export async function endStream(id) {
  await supabase.from('live_streams').update({ is_active: false, ended_at: new Date().toISOString(), viewer_count: 0 }).eq('id', id)
}

export async function setViewerCount(id, n) {
  await supabase.from('live_streams').update({ viewer_count: n }).eq('id', id)
}

export async function fetchLiveComments(streamId) {
  const { data, error } = await supabase.from('live_comments')
    .select('*, profiles:user_id(id,username,avatar_url)').eq('stream_id', streamId)
    .order('created_at', { ascending: false }).limit(50)
  if (error) throw error
  return data.reverse()
}

export async function sendLiveComment(streamId, userId, content) {
  const { error } = await supabase.from('live_comments').insert({ stream_id: streamId, user_id: userId, content: content.trim() })
  if (error) throw error
}

const turnUrls = (import.meta.env.VITE_TURN_URL || '')
  .split(',').map((u) => u.trim()).filter(Boolean)

export const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ...(turnUrls.length ? [{
    urls: turnUrls,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  }] : []),
]