import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Hash, X, SearchX } from 'lucide-react'
import toast from 'react-hot-toast'
import PostGrid from '../components/video/PostGrid'
import UserRow from '../components/common/UserRow'
import FollowButton from '../components/common/FollowButton'
import EmptyState from '../components/common/EmptyState'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'
import { searchUsers } from '../services/profileService'
import { getFollowingSet } from '../services/followService'
import * as videoService from '../services/videoService'
import { useT } from '../lib/i18n'
import { cn, errorMessage, formatCount } from '../lib/utils'

const TABS = [['users', 'People'], ['videos', 'Videos'], ['tags', 'Hashtags']]

export default function Explore() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [params, setParams] = useSearchParams()
  const tag = params.get('tag')
  const [q, setQ] = useState(params.get('q') || '')
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [following, setFollowing] = useState(new Set())
  const [posts, setPosts] = useState([])
  const [trending, setTrending] = useState([])
  const [recent, setRecent] = useState([])

  useEffect(() => {
    videoService.trendingHashtags().then(setTrending).catch(() => {})
    videoService.fetchFeed({ limit: 30 }).then(setRecent).catch(() => {})
  }, [])

  useEffect(() => {
    if (tag) { setLoading(true); videoService.postsByHashtag(tag).then(setPosts).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false)) }
  }, [tag])

  useEffect(() => {
    const term = q.trim()
    if (!term || tag) { setUsers([]); if (!tag) setPosts([]); return }
    let alive = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const clean = term.replace(/^[#@]/, '')
        const [u, p] = await Promise.all([searchUsers(clean), term.startsWith('#') ? videoService.postsByHashtag(clean) : videoService.searchPosts(clean)])
        if (!alive) return
        setUsers(u); setPosts(p)
        setFollowing(await getFollowingSet(user.id, u.map((x) => x.id)))
        if (term.startsWith('#')) setTab('videos')
      } catch (e) { toast.error(errorMessage(e)) }
      finally { alive && setLoading(false) }
    }, 300)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, tag, user.id])

  const tagMatches = trending.filter((h) => h.tag.includes(q.trim().replace(/^#/, '').toLowerCase()))

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 sm:px-5">
      <h1 className="page-title mb-4 px-1">{t('explore')}</h1>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg/45" />
        <input value={q} onChange={(e) => { setQ(e.target.value); if (tag) setParams({}) }} placeholder="Search people, videos or #hashtags"
          className="input rounded-2xl py-3.5 pl-11 pr-11 text-base" aria-label={t('search')} />
        {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/50" aria-label="Clear search"><X size={18} /></button>}
      </div>

      {tag ? (
        <section className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-400/15 text-sky-400"><Hash size={26} /></span>
            <div><h2 className="font-display text-lg font-semibold">#{tag}</h2><p className="text-sm text-fg/55">{posts.length} posts</p></div>
            <button className="btn-ghost ml-auto" onClick={() => setParams({})}>Clear</button>
          </div>
          {loading ? <div className="grid py-10 place-items-center"><Spinner /></div> : posts.length ? <PostGrid posts={posts} /> : <EmptyState icon={Hash} title="No posts with this hashtag yet" />}
        </section>
      ) : q.trim() ? (
        <section className="mt-5">
          <div className="mb-4 flex gap-1 rounded-xl bg-fg/5 p-1">
            {TABS.map(([k, label]) => <button key={k} onClick={() => setTab(k)} className={cn('flex-1 rounded-lg py-2 text-sm font-semibold transition', tab === k ? 'bg-fg/10' : 'text-fg/55')}>{label}</button>)}
          </div>
          {loading ? <div className="grid py-10 place-items-center"><Spinner /></div> : (
            <>
              {tab === 'users' && (users.length ? <div className="glass-card p-2">{users.map((u) => <UserRow key={u.id} user={u} subtitle={`${formatCount(u.followers_count)} followers`} right={<FollowButton userId={u.id} initial={following.has(u.id)} compact />} />)}</div>
                : <EmptyState icon={SearchX} title="No people found" text="Try a different name or username." />)}
              {tab === 'videos' && (posts.length ? <PostGrid posts={posts} /> : <EmptyState icon={SearchX} title="No videos found" />)}
              {tab === 'tags' && (tagMatches.length ? (
                <div className="glass-card p-2">{tagMatches.map((h) => (
                  <Link key={h.tag} to={`/explore?tag=${encodeURIComponent(h.tag)}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-fg/5">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-sky-400/15 text-sky-400"><Hash size={19} /></span>
                    <span className="flex-1 font-semibold">#{h.tag}</span><span className="text-sm text-fg/50">{formatCount(h.uses)} posts</span>
                  </Link>))}</div>
              ) : <EmptyState icon={Hash} title="No matching hashtags" />)}
            </>
          )}
        </section>
      ) : (
        <>
          {trending.length > 0 && (
            <div className="scrollbar-none -mx-3 mt-5 flex gap-2 overflow-x-auto px-3">
              {trending.map((h) => (
                <Link key={h.tag} to={`/explore?tag=${encodeURIComponent(h.tag)}`} className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold glass hover:bg-fg/10">
                  #{h.tag} <span className="text-fg/45">{formatCount(h.uses)}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-5">{recent.length ? <PostGrid posts={recent} /> : <EmptyState icon={Search} title="Nothing to explore yet" text="New videos and photos will show up here." />}</div>
        </>
      )}
    </div>
  )
}
