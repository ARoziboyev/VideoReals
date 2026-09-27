import supabase from "../lib/supabase";

const PROFILE = "id,username,first_name,last_name,avatar_url";

export async function getFollowingSet(userId, ids) {
  if (!userId || !ids?.length) return new Set();
  const { data } = await supabase
    .from("followers")
    .select("following_id")
    .eq("follower_id", userId)
    .in("following_id", ids);
  return new Set((data || []).map((r) => r.following_id));
}

export async function follow(followerId, followingId) {
  const { error } = await supabase
    .from("followers")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error && error.code !== "23505") throw error;
}

export async function unfollow(followerId, followingId) {
  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

export async function getFollowers(userId) {
  const { data, error } = await supabase
    .from("followers")
    .select(`created_at, profile:follower_id(${PROFILE})`)
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map((r) => r.profile).filter(Boolean);
}

export async function getFollowing(userId) {
  const { data, error } = await supabase
    .from("followers")
    .select(`created_at, profile:following_id(${PROFILE})`)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map((r) => r.profile).filter(Boolean);
}
