import supabase from '../lib/supabase'

export const COMMENT_SELECT = '*, profiles:user_id(id,username,first_name,last_name,avatar_url)'

export async function fetchComments(postId) {
  const { data, error } = await supabase.from('comments').select(COMMENT_SELECT).eq('post_id', postId)
    .order('created_at', { ascending: true }).limit(500)
  if (error) throw error
  return data
}

export async function getLikedCommentIds(ids, userId) {
  if (!ids.length) return new Set()
  const { data } = await supabase.from('comment_likes').select('comment_id').eq('user_id', userId).in('comment_id', ids)
  return new Set((data || []).map((r) => r.comment_id))
}

export async function addComment({ postId, userId, content, parentId = null }) {
  const { data, error } = await supabase.from('comments')
    .insert({ post_id: postId, user_id: userId, content: content.trim(), parent_id: parentId })
    .select(COMMENT_SELECT).single()
  if (error) throw error
  return data
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

export async function setCommentLike(commentId, userId, like) {
  const { error } = like
    ? await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
    : await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
  if (error && error.code !== '23505') throw error
}
