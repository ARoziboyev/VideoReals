import supabase from '../lib/supabase'
import { uploadFile, removeByUrl } from './storageService'
import { parseHashtags, sanitizeSearch } from '../lib/utils'

export const POST_SELECT = '*, profiles:user_id(id,username,first_name,last_name,avatar_url)'

export async function fetchFeed({ before, limit = 8, mediaType } = {}) {
  let q = supabase.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(limit)
  if (before) q = q.lt('created_at', before)
  if (mediaType) q = q.eq('media_type', mediaType)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchPost(id) {
  const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchUserPosts(userId, mediaType) {
  let q = supabase.from('posts').select(POST_SELECT).eq('user_id', userId).order('created_at', { ascending: false }).limit(60)
  if (mediaType) q = q.eq('media_type', mediaType)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchSavedPosts(userId) {
  const { data, error } = await supabase.from('saved_posts').select(`created_at, post:post_id(${POST_SELECT})`)
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(60)
  if (error) throw error
  return data.map((r) => r.post).filter(Boolean)
}

export async function searchPosts(q) {
  const s = sanitizeSearch(q)
  if (!s) return []
  const { data, error } = await supabase.from('posts').select(POST_SELECT).ilike('caption', `%${s}%`)
    .order('likes_count', { ascending: false }).limit(30)
  if (error) throw error
  return data
}

export async function postsByHashtag(tag) {
  const { data, error } = await supabase.from('posts').select(POST_SELECT).contains('hashtags', [tag.toLowerCase()])
    .order('created_at', { ascending: false }).limit(60)
  if (error) throw error
  return data
}

export async function trendingHashtags() {
  const { data, error } = await supabase.rpc('trending_hashtags', { p_limit: 20 })
  if (error) throw error
  return data
}

export async function getInteractions(postIds, userId) {
  if (!postIds.length || !userId) return { liked: new Set(), saved: new Set() }
  const [likes, saved] = await Promise.all([
    supabase.from('likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
    supabase.from('saved_posts').select('post_id').eq('user_id', userId).in('post_id', postIds),
  ])
  return {
    liked: new Set((likes.data || []).map((r) => r.post_id)),
    saved: new Set((saved.data || []).map((r) => r.post_id)),
  }
}

export async function setLike(postId, userId, like) {
  const { error } = like
    ? await supabase.from('likes').insert({ post_id: postId, user_id: userId })
    : await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
  if (error && error.code !== '23505') throw error
}

export async function setSaved(postId, userId, save) {
  const { error } = save
    ? await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId })
    : await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId)
  if (error && error.code !== '23505') throw error
}

export async function createPost({ userId, file, thumbnail, caption = '', mediaType, visibility = 'public' }) {
  const isVideo = mediaType === 'video'
  const mediaUrl = await uploadFile(isVideo ? 'videos' : 'images', file, userId)
  let thumbUrl = null
  if (thumbnail) thumbUrl = await uploadFile('thumbnails', thumbnail, userId)
  const { data, error } = await supabase.from('posts').insert({
    user_id: userId,
    media_type: mediaType,
    video_url: isVideo ? mediaUrl : null,
    image_url: isVideo ? null : mediaUrl,
    thumbnail_url: thumbUrl || (isVideo ? null : mediaUrl),
    caption: caption.trim(),
    hashtags: parseHashtags(caption),
    visibility,
  }).select(POST_SELECT).single()
  if (error) {
    removeByUrl(mediaUrl, isVideo ? 'videos' : 'images').catch(() => {})
    throw error
  }
  return data
}

export async function deletePost(post) {
  const { error } = await supabase.from('posts').delete().eq('id', post.id)
  if (error) throw error
  if (post.video_url) removeByUrl(post.video_url, 'videos').catch(() => {})
  if (post.image_url) removeByUrl(post.image_url, 'images').catch(() => {})
  if (post.thumbnail_url && post.thumbnail_url !== post.image_url) removeByUrl(post.thumbnail_url, 'thumbnails').catch(() => {})
}

export async function fetchLikers(postId) {
  const { data, error } = await supabase.from('likes')
    .select('created_at, profile:user_id(id,username,first_name,last_name,avatar_url)')
    .eq('post_id', postId).order('created_at', { ascending: false }).limit(300)
  if (error) throw error
  return data.map((r) => r.profile).filter(Boolean)
}

export async function fetchLikedPosts(userId) {
  const { data, error } = await supabase.from('likes').select(`created_at, post:post_id(${POST_SELECT})`)
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(120)
  if (error) throw error
  return data.map((r) => r.post && { ...r.post, liked_at: r.created_at }).filter(Boolean)
}

export function downloadPost(post) {
  const url = post.video_url || post.image_url
  const ext = (url.split('?')[0].split('.').pop() || (post.video_url ? 'mp4' : 'jpg')).toLowerCase()
  const name = `videomove-${post.id.slice(0, 8)}.${ext}`
  const a = document.createElement('a')
  a.href = `${url}?download=${encodeURIComponent(name)}`
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}