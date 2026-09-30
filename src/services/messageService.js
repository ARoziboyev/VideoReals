import supabase from '../lib/supabase'
import { uploadFile, getSignedUrl } from './storageService'

export const bucketFor = (type) => (type === 'voice' ? 'voice-messages' : 'chat-media')

export async function fetchConversations() {
  const { data, error } = await supabase.rpc('get_my_conversations')
  if (error) throw error
  return data || []
}

export async function getOrCreateDM(otherUserId) {
  const { data, error } = await supabase.rpc('get_or_create_dm', { other_user: otherUserId })
  if (error) throw error
  return data
}

export async function createGroup(title, memberIds) {
  const { data, error } = await supabase.rpc('create_group_conversation', { p_title: title, p_members: memberIds })
  if (error) throw error
  return data
}

export async function leaveConversation(conversationId, userId) {
  const { error } = await supabase.from('conversation_members').delete().eq('conversation_id', conversationId).eq('user_id', userId)
  if (error) throw error
}

export async function fetchMessages(conversationId, { before, limit = 50 } = {}) {
  let q = supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(limit)
  if (before) q = q.lt('created_at', before)
  const { data, error } = await q
  if (error) throw error
  return data.reverse()
}

export async function fetchReactions(conversationId) {
  const { data, error } = await supabase.from('message_reactions').select('message_id,user_id,emoji').eq('conversation_id', conversationId)
  if (error) throw error
  return data
}

export function detectType(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'voice'
  return 'file'
}

export async function sendMessage({ conversationId, senderId, receiverId = null, content = '', type = 'text', file = null, duration = null, replyTo = null, meta = null }) {
  let media_url = null
  if (file) media_url = await uploadFile(bucketFor(type), file, `${conversationId}/${senderId}`)
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    content: content?.trim() || null,
    message_type: type,
    media_url,
    file_name: file?.name || null,
    file_size: file?.size || null,
    duration,
    reply_to: replyTo,
    meta,
  }).select().single()
  if (error) throw error
  return data
}

export async function editMessage(id, content) {
  const { data, error } = await supabase.from('messages').update({ content: content.trim(), edited_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMessage(message) {
  const { data, error } = await supabase.from('messages')
    .update({ is_deleted: true, content: null, media_url: null, file_name: null }).eq('id', message.id).select().single()
  if (error) throw error
  if (message.media_url) supabase.storage.from(bucketFor(message.message_type)).remove([message.media_url]).catch(() => {})
  return data
}

export async function forwardMessage(message, targetConversationId, senderId) {
  let media_url = null
  if (message.media_url) {
    const bucket = bucketFor(message.message_type)
    const name = message.media_url.split('/').pop()
    const to = `${targetConversationId}/${senderId}/fwd-${Date.now()}-${name}`
    const { error: copyError } = await supabase.storage.from(bucket).copy(message.media_url, to)
    if (copyError) throw copyError
    media_url = to
  }
  const { error } = await supabase.from('messages').insert({
    conversation_id: targetConversationId, sender_id: senderId, content: message.content, message_type: message.message_type,
    media_url, file_name: message.file_name, file_size: message.file_size, duration: message.duration, forwarded: true,
  })
  if (error) throw error
}

export async function toggleReaction({ messageId, conversationId, userId, emoji, active }) {
  const { error } = active
    ? await supabase.from('message_reactions').delete().match({ message_id: messageId, user_id: userId, emoji })
    : await supabase.from('message_reactions').insert({ message_id: messageId, conversation_id: conversationId, user_id: userId, emoji })
  if (error && error.code !== '23505') throw error
}

export async function markRead(conversationId) {
  const { error } = await supabase.rpc('mark_conversation_read', { cid: conversationId })
  if (error) throw error
}

export async function markDelivered(conversationId = null) {
  const { error } = await supabase.rpc('mark_messages_delivered', { cid: conversationId })
  if (error) throw error
}

export const mediaUrl = (message) => getSignedUrl(bucketFor(message.message_type), message.media_url)