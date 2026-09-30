import supabase from '../lib/supabase'
import { uploadFile, removeByUrl } from './storageService'
import { sanitizeSearch } from '../lib/utils'

export const TRACK_SELECT = '*, profiles:user_id(id,username,avatar_url)'

export async function fetchTracks({ q = '', order = 'new', limit = 60 } = {}) {
  let query = supabase.from('tracks').select(TRACK_SELECT).limit(limit)
  const s = sanitizeSearch(q)
  if (s) query = query.or(`title.ilike.%${s}%,artist.ilike.%${s}%`)
  query = order === 'top' ? query.order('plays_count', { ascending: false }) : query.order('created_at', { ascending: false })
  const { data, error } = await query
  if (error) throw error
  return data
}

export function readAudioDuration(file) {
  return new Promise((resolve) => {
    const a = document.createElement('audio')
    const url = URL.createObjectURL(file)
    a.preload = 'metadata'
    a.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Number.isFinite(a.duration) ? Math.round(a.duration) : null) }
    a.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    a.src = url
  })
}

export async function uploadTrack({ userId, file, cover, title, artist }) {
  const duration = await readAudioDuration(file)
  const audio_url = await uploadFile('music', file, userId)
  let cover_url = null
  if (cover) cover_url = await uploadFile('images', cover, userId)
  const { data, error } = await supabase.from('tracks')
    .insert({ user_id: userId, title: title.trim(), artist: artist.trim(), audio_url, cover_url, duration })
    .select(TRACK_SELECT).single()
  if (error) { removeByUrl(audio_url, 'music').catch(() => {}); throw error }
  return data
}

export async function deleteTrack(track) {
  const { error } = await supabase.from('tracks').delete().eq('id', track.id)
  if (error) throw error
  removeByUrl(track.audio_url, 'music').catch(() => {})
  if (track.cover_url) removeByUrl(track.cover_url, 'images').catch(() => {})
}

export async function countPlay(trackId) {
  await supabase.rpc('increment_track_play', { tid: trackId })
}