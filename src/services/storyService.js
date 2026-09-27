import supabase from '../lib/supabase'
import { uploadFile, removeByUrl } from './storageService'

export async function fetchActiveStories() {
  const { data, error } = await supabase.from('stories')
    .select('*, profiles:user_id(id,username,first_name,last_name,avatar_url)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
  if (error) throw error
  const groups = new Map()
  for (const s of data) {
    if (!groups.has(s.user_id)) groups.set(s.user_id, { user: s.profiles, stories: [] })
    groups.get(s.user_id).stories.push(s)
  }
  return [...groups.values()]
}

export async function getViewedIds(ids, userId) {
  if (!ids.length) return new Set()
  const { data } = await supabase.from('story_views').select('story_id').eq('viewer_id', userId).in('story_id', ids)
  return new Set((data || []).map((r) => r.story_id))
}

export async function createStory({ userId, file, mediaType, text, background }) {
  let media_url = null
  if (mediaType !== 'text') media_url = await uploadFile('stories', file, userId)
  const { data, error } = await supabase.from('stories').insert({
    user_id: userId, media_type: mediaType, media_url,
    text_content: mediaType === 'text' ? text.trim() : (text?.trim() || null),
    background: background || null,
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteStory(story) {
  const { error } = await supabase.from('stories').delete().eq('id', story.id)
  if (error) throw error
  if (story.media_url) removeByUrl(story.media_url, 'stories').catch(() => {})
}

export async function markViewed(storyId, userId) {
  await supabase.from('story_views').upsert({ story_id: storyId, viewer_id: userId }, { onConflict: 'story_id,viewer_id', ignoreDuplicates: true })
}

export async function fetchViewers(storyId) {
  const { data, error } = await supabase.from('story_views')
    .select('created_at, profile:viewer_id(id,username,first_name,last_name,avatar_url)')
    .eq('story_id', storyId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function isStoryLiked(storyId, userId) {
  const { data } = await supabase.from('story_likes').select('story_id').eq('story_id', storyId).eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

export async function setStoryLike(storyId, userId, like) {
  const { error } = like
    ? await supabase.from('story_likes').insert({ story_id: storyId, user_id: userId })
    : await supabase.from('story_likes').delete().eq('story_id', storyId).eq('user_id', userId)
  if (error && error.code !== '23505') throw error
}
