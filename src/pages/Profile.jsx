import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, Grid3x3, Clapperboard, Bookmark, UserX, MessageCircle, Camera, Share2, CalendarDays, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import Avatar from '../components/common/Avatar'
import FollowButton from '../components/common/FollowButton'
import EmptyState from '../components/common/EmptyState'
import { PageLoader } from '../components/common/Spinner'
import PostGrid from '../components/video/PostGrid'
import EditProfileModal from '../components/profile/EditProfileModal'
import FollowListModal from '../components/profile/FollowListModal'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { getProfileByUsername } from '../services/profileService'
import { getFollowingSet } from '../services/followService'
import { getOrCreateDM } from '../services/messageService'
import * as videoService from '../services/videoService'
import { useT } from '../lib/i18n'
import { cn, errorMessage, formatCount, fullName, lastSeenText } from '../lib/utils'

function Stat({ value, label, onClick, i }) {
  return (
    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
      onClick={onClick} disabled={!onClick}
      className="glass-edge flex-1 rounded-2xl bg-fg/[0.045] px-3 py-3 text-center transition hover:bg-fg/[0.08] disabled:hover:bg-fg/[0.045]">
      <span className="block font-display text-lg font-semibold sm:text-xl">{formatCount(value)}</span>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-fg/50">{label}</span>
    </motion.button>
  )
}

export default function Profile() {
  const t = useT()
  const { username } = useParams()
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const myProfile = useAuthStore((s) => s.profile)
  const online = useUIStore((s) => s.onlineUsers)
  const setUploadType = useUIStore((s) => s.setUploadType)
  const [profile, setProfile] = useState(undefined)
  const [isFollowing, setIsFollowing] = useState(false)
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState(null)
  const [edit, setEdit] = useState(false)
  const [list, setList] = useState(null)
  const [messaging, setMessaging] = useState(false)
  const own = profile?.id === me.id

  useEffect(() => {
    setProfile(undefined); setTab('posts')
    getProfileByUsername(username).then(async (p) => {
      setProfile(p)
      if (p && p.id !== me.id) setIsFollowing((await getFollowingSet(me.id, [p.id])).has(p.id))
    }).catch(() => setProfile(null))
  }, [username, me.id])

  useEffect(() => { if (own && myProfile) setProfile((p) => ({ ...p, ...myProfile })) }, [myProfile, own])

  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`profile-${profile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` }, ({ new: n }) => setProfile((p) => ({ ...p, ...n })))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id) return
    setPosts(null)
    const req = tab === 'saved' ? videoService.fetchSavedPosts(me.id)
      : tab === 'liked' ? videoService.fetchLikedPosts(me.id)
      : videoService.fetchUserPosts(profile.id, tab === 'videos' ? 'video' : undefined)
    req.then(setPosts).catch((e) => { toast.error(errorMessage(e)); setPosts([]) })
  }, [profile?.id, tab, me.id])

  useEffect(() => {
    const onCreated = (e) => { if (own && (tab === 'posts' || (tab === 'videos' && e.detail.media_type === 'video'))) setPosts((p) => (p ? [e.detail, ...p] : p)) }
    window.addEventListener('vm:post-created', onCreated)
    return () => window.removeEventListener('vm:post-created', onCreated)
  }, [own, tab])

  const message = async () => {
    setMessaging(true)
    try { navigate(`/messages/${await getOrCreateDM(profile.id)}`) }
    catch (e) { toast.error(errorMessage(e)) }
    finally { setMessaging(false) }
  }
  const shareProfile = async () => {
    const url = `${window.location.origin}/u/${profile.username}`
    try { if (navigator.share) await navigator.share({ title: profile.username, url }); else { await navigator.clipboard.writeText(url); toast.success('Profile link copied') } }
    catch { /* dismissed */ }
  }

  if (profile === undefined) return <PageLoader />
  if (profile === null) return <EmptyState icon={UserX} title="User not found" text={`There is no account named @${username}.`} />

  const tabs = [['posts', Grid3x3, t('posts')], ['videos', Clapperboard, t('videos')], ...(own ? [['saved', Bookmark, t('saved')], ['liked', Heart, t('likeHistory')]] : [])]
  const isOnline = online.has(profile.id)
  const joined = new Date(profile.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-4xl px-3 pb-10 pt-4 sm:px-6 sm:pt-6">
      <section className="glass-card overflow-hidden">
        {/* cover */}
        <div className="relative h-40 overflow-hidden sm:h-56">
          {profile.cover_url
            ? <motion.img initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} src={profile.cover_url} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full" style={{ background: 'radial-gradient(120% 140% at 0% 0%, #7C3AED 0%, transparent 55%), radial-gradient(120% 140% at 100% 0%, #2563EB 0%, transparent 55%), radial-gradient(120% 140% at 60% 120%, #DB2777 0%, transparent 60%), #0b0c1f' }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg))] via-[rgb(var(--bg)/0.2)] to-transparent" />
          {own && (
            <button onClick={() => setEdit(true)} className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl hover:bg-black/50">
              <Camera size={14} /> Edit cover
            </button>
          )}
        </div>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="relative w-fit rounded-full p-1.5 glass-strong">
              <Avatar src={profile.avatar_url} name={fullName(profile)} size={124} online={isOnline && !own} />
              {own && <button onClick={() => setEdit(true)} className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border-2 border-[rgb(var(--bg))] bg-violet-500 text-white" aria-label="Change photo"><Camera size={15} /></button>}
            </motion.div>
            <div className="min-w-0 flex-1 sm:pb-2">
              <h1 className="truncate font-display text-2xl font-semibold tracking-tight sm:text-[1.8rem]">{fullName(profile)}</h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg/55">
                <span className="font-semibold text-fg/75">@{profile.username}</span>
                {!own && <span className={cn(isOnline && 'text-emerald-400')}>{lastSeenText(profile, isOnline)}</span>}
                <span className="flex items-center gap-1"><CalendarDays size={13} />Joined {joined}</span>
              </p>
            </div>
            <div className="flex gap-2 sm:pb-2">
              {own ? (
                <>
                  <button className="btn-ghost" onClick={() => setEdit(true)}>{t('editProfile')}</button>
                  <button className="icon-btn glass" onClick={shareProfile} aria-label={t('share')}><Share2 size={18} /></button>
                  <Link to="/settings" className="icon-btn glass" aria-label={t('settings')}><Settings size={19} /></Link>
                </>
              ) : (
                <>
                  <FollowButton userId={profile.id} initial={isFollowing} onChange={(v) => { setIsFollowing(v); setProfile((p) => ({ ...p, followers_count: Math.max(0, p.followers_count + (v ? 1 : -1)) })) }} />
                  <button className="btn-ghost" disabled={messaging} onClick={message}><MessageCircle size={16} />{t('message')}</button>
                  <button className="icon-btn glass" onClick={shareProfile} aria-label={t('share')}><Share2 size={18} /></button>
                </>
              )}
            </div>
          </div>

          {profile.bio && <p className="mt-4 max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed text-fg/80">{profile.bio}</p>}

          <div className="mt-5 flex gap-2.5">
            <Stat i={0} value={profile.posts_count} label={t('posts')} />
            <Stat i={1} value={profile.followers_count} label={t('followers')} onClick={() => setList('followers')} />
            <Stat i={2} value={profile.following_count} label={t('followingCount')} onClick={() => setList('following')} />
          </div>
        </div>
      </section>

      <div className="scrollbar-none sticky top-2 z-20 mt-5 flex gap-1 overflow-x-auto rounded-2xl p-1 glass-strong">
        {tabs.map(([k, Icon, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors', tab === k ? 'text-fg' : 'text-fg/50 hover:text-fg/80')}>
            {tab === k && <motion.span layoutId="profile-tab" transition={{ type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-xl bg-fg/[0.12] shadow-[inset_0_1px_0_var(--hl)]" />}
            <Icon size={17} className="relative" /><span className="relative hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {!posts ? <PageLoader /> : posts.length ? <PostGrid posts={posts} /> : (
          <EmptyState icon={tab === 'saved' ? Bookmark : tab === 'liked' ? Heart : Clapperboard}
            title={tab === 'saved' ? 'Nothing saved yet' : tab === 'liked' ? 'No likes yet' : own ? 'Share your first post' : 'No posts yet'}
            text={tab === 'saved' ? 'Tap the bookmark on any post to keep it here.' : tab === 'liked' ? 'Posts you like will appear here.' : undefined}
            action={own && (tab === 'posts' || tab === 'videos') ? <button className="btn-primary" onClick={() => setUploadType(tab === 'videos' ? 'video' : 'image')}>{tab === 'videos' ? t('uploadVideo') : t('create')}</button> : null} />
        )}
      </div>

      <EditProfileModal open={edit} onClose={() => setEdit(false)} onSaved={(p) => { setProfile((x) => ({ ...x, ...p })); if (p.username !== username) navigate(`/u/${p.username}`, { replace: true }) }} />
      <FollowListModal userId={profile.id} type={list} onClose={() => setList(null)} />
    </div>
  )
}