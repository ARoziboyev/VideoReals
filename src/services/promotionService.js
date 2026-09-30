import supabase from '../lib/supabase'
import { POST_SELECT } from './videoService'

export async function createPromotion({ postId, userId, goal, audience, interests, dailyBudget, days }) {
  const { data, error } = await supabase.from('promotions').insert({
    post_id: postId, user_id: userId, goal, audience,
    interests: audience === 'interests' ? interests : [],
    daily_budget: dailyBudget, days,
  }).select().single()
  if (error) throw error
  return data
}

export async function fetchMyPromotions(userId) {
  const { data, error } = await supabase.from('promotions')
    .select('*, post:post_id(id,caption,thumbnail_url,image_url,video_url,media_type)')
    .eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function setPromotionStatus(id, status) {
  const { error } = await supabase.from('promotions').update({ status }).eq('id', id)
  if (error) throw error
}

export async function fetchSponsored(limit = 3) {
  const { data, error } = await supabase.rpc('get_sponsored_posts', { p_limit: limit })
  if (error || !data?.length) return []
  const { data: posts } = await supabase.from('posts').select(POST_SELECT).in('id', data.map((d) => d.post_id))
  return data
    .map((d) => {
      const post = posts?.find((p) => p.id === d.post_id)
      return post && { ...post, sponsored: { promotionId: d.promotion_id, goal: d.goal } }
    })
    .filter(Boolean)
}

export async function trackPromotion(promotionId, kind) {
  await supabase.rpc('track_promotion', { pid: promotionId, kind })
}

export function estimateReach(dailyBudget, days) {
  const total = dailyBudget * days
  return { total, min: Math.round(total / 60), max: Math.round(total / 25) }
}