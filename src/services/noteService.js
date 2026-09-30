import supabase from '../lib/supabase'
import { uploadFile } from './storageService'

const NOTE_SELECT = '*, profiles:user_id(id,username,first_name,last_name,avatar_url), track:track_id(id,title,artist,audio_url,cover_url,duration)'

export async function fetchNotes() {
  const { data, error } = await supabase.from('notes').select(NOTE_SELECT)
    .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  return data
}

export async function createNote({ userId, text = '', trackId = null, file = null, gifUrl = null, visibility = 'public' }) {
  let media_url = gifUrl
  let media_type = gifUrl ? 'gif' : null
  if (file) {
    media_url = await uploadFile('images', file, userId)
    media_type = file.type === 'image/gif' ? 'gif' : 'image'
  }
  await supabase.from('notes').delete().eq('user_id', userId)
  const { data, error } = await supabase.from('notes')
    .insert({ user_id: userId, text: text.trim() || null, track_id: trackId, media_url, media_type, visibility })
    .select(NOTE_SELECT).single()
  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}