import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Settings, Grid3x3, Clapperboard, Bookmark, UserX, MessageCircle, Camera } from 'lucide-react'
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
    const req = tab === 'saved' ? videoService.fetchSavedPosts(me.id) : videoService.fetchUserPosts(profile.id, tab === 'videos' ? 'video' : undefined)
    req.then(setPosts).catch((e) => { toast.error(errorMessage(e)); setPosts([]) })
  }, [profile?.id, tab, me.id])

  useEffect(() => {
    const onCreated = (e) => { if (own && tab !== 'saved') setPosts((p) => (p ? [e.detail, ...p] : p)) }
    window.addEventListener('vm:post-created', onCreated)
    return () => window.removeEventListener('vm:post-created', onCreated)
  }, [own, tab])

  const message = async () => {
    setMessaging(true)
    try { navigate(`/messages/${await getOrCreateDM(profile.id)}`) }
    catch (e) { toast.error(errorMessage(e)) }
    finally { setMessaging(false) }
  }

  if (profile === undefined) return <PageLoader />
  if (profile === null) return <EmptyState icon={UserX} title="User not found" text={`There is no account named @${username}.`} />

  const tabs = [['posts', Grid3x3, t('posts')], ['videos', Clapperboard, t('videos')], ...(own ? [['saved', Bookmark, t('saved')]] : [])]
  const isOnline = online.has(profile.id)

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6">
      <section className="glass-card relative overflow-hidden p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-60" style={{ backgroundImage: 'linear-gradient(120deg,rgba(139,92,246,.35),rgba(79,124,255,.25),rgba(236,72,153,.25))' }} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative w-fit">
            <Avatar src={profile.avatar_url} name={fullName(profile)} size={112} className="ring-4 ring-[rgb(var(--bg))] rounded-full" />
            {own && <button onClick={() => setEdit(true)} className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-violet-500 text-white" aria-label="Change photo"><Camera size={15} /></button>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-xl font-semibold">{profile.username}</h1>
              {own ? (
                <>
                  <button className="btn-ghost py-2" onClick={() => setEdit(true)}>{t('editProfile')}</button>
                  <Link to="/settings" className="icon-btn" aria-label={t('settings')}><Settings size={20} /></Link>
                </>
              ) : (
                <>
                  <FollowButton userId={profile.id} initial={isFollowing} onChange={setIsFollowing} className="py-2" />
                  <button className="btn-ghost py-2" disabled={messaging} onClick={message}><MessageCircle size={16} />{t('message')}</button>
                </>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-fg/80">{fullName(profile)}</p>
            {!own && <p className={cn('mt-0.5 text-xs', isOnline ? 'text-emerald-400' : 'text-fg/45')}>{lastSeenText(profile, isOnline)}</p>}
            {profile.bio && <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-fg/75">{profile.bio}</p>}
            <div className="mt-4 flex gap-6 text-sm">
              <span><b className="text-base">{formatCount(profile.posts_count)}</b> <span className="text-fg/55">{t('posts')}</span></span>
              <button onClick={() => setList('followers')} className="hover:opacity-80"><b className="text-base">{formatCount(profile.followers_count)}</b> <span className="text-fg/55">{t('followers')}</span></button>
              <button onClick={() => setList('following')} className="hover:opacity-80"><b className="text-base">{formatCount(profile.following_count)}</b> <span className="text-fg/55">{t('followingCount')}</span></button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-1 rounded-2xl p-1 glass">
        {tabs.map(([k, Icon, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition', tab === k ? 'bg-fg/10 text-fg' : 'text-fg/50 hover:text-fg/80')}>
            <Icon size={17} /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {!posts ? <PageLoader /> : posts.length ? <PostGrid posts={posts} /> : (
          <EmptyState icon={tab === 'saved' ? Bookmark : Clapperboard}
            title={tab === 'saved' ? 'Nothing saved yet' : own ? 'Share your first post' : 'No posts yet'}
            text={tab === 'saved' ? 'Tap the bookmark on any post to keep it here.' : undefined}
            action={own && tab !== 'saved' ? <button className="btn-primary" onClick={() => setUploadType(tab === 'videos' ? 'video' : 'image')}>{tab === 'videos' ? t('uploadVideo') : t('create')}</button> : null} />
        )}
      </div>

      <EditProfileModal open={edit} onClose={() => setEdit(false)} onSaved={(p) => { setProfile((x) => ({ ...x, ...p })); if (p.username !== username) navigate(`/u/${p.username}`, { replace: true }) }} />
      <FollowListModal userId={profile.id} type={list} onClose={() => setList(null)} />
    </div>
  )
}
