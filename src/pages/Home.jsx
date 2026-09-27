import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clapperboard, ArrowUp } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import TopBar from '../components/layout/TopBar'
import StoriesBar from '../components/stories/StoriesBar'
import VideoCard from '../components/video/VideoCard'
import EmptyState from '../components/common/EmptyState'
import Spinner from '../components/common/Spinner'
import UserRow from '../components/common/UserRow'
import FollowButton from '../components/common/FollowButton'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { useInView } from '../hooks/useInView'
import * as videoService from '../services/videoService'
import { suggestedUsers } from '../services/profileService'
import { errorMessage } from '../lib/utils'

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const setUploadType = useUIStore((s) => s.setUploadType)
  const [posts, setPosts] = useState([])
  const [liked, setLiked] = useState(new Set())
  const [saved, setSaved] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const [suggested, setSuggested] = useState([])
  const [sentinel, sentinelVisible] = useInView({ threshold: 0, rootMargin: '600px' })

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const before = reset ? null : posts.at(-1)?.created_at
      const data = await videoService.fetchFeed({ before })
      const inter = await videoService.getInteractions(data.map((p) => p.id), user.id)
      setLiked((s) => new Set([...(reset ? [] : s), ...inter.liked]))
      setSaved((s) => new Set([...(reset ? [] : s), ...inter.saved]))
      setPosts((p) => (reset ? data : [...p, ...data.filter((d) => !p.some((x) => x.id === d.id))]))
      setHasMore(data.length === 8)
      if (reset) setNewCount(0)
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setLoading(false) }
  }, [posts, user.id])

  useEffect(() => { load(true); suggestedUsers(user.id).then(setSuggested).catch(() => {}) }, [])
  useEffect(() => { if (sentinelVisible && hasMore && !loading) load() }, [sentinelVisible])

  useEffect(() => {
    const onCreated = (e) => setPosts((p) => [e.detail, ...p])
    window.addEventListener('vm:post-created', onCreated)
    const ch = supabase.channel('feed-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'UPDATE') setPosts((ps) => ps.map((x) => (x.id === payload.new.id ? { ...x, ...payload.new } : x)))
        if (payload.eventType === 'DELETE') setPosts((ps) => ps.filter((x) => x.id !== payload.old.id))
        if (payload.eventType === 'INSERT' && payload.new.user_id !== user.id) setNewCount((c) => c + 1)
      }).subscribe()
    return () => { window.removeEventListener('vm:post-created', onCreated); supabase.removeChannel(ch) }
  }, [user.id])

  return (
    <div>
      <TopBar />
      <div className="mx-auto flex max-w-5xl justify-center gap-8 px-0 sm:px-4">
        <div className="w-full max-w-[560px]">
          <StoriesBar />
          {newCount > 0 && (
            <div className="sticky top-20 z-20 flex justify-center">
              <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); load(true) }} className="btn-primary rounded-full py-2 text-xs"><ArrowUp size={14} /> {newCount} new posts</button>
            </div>
          )}
          <div className="space-y-5 px-3 sm:px-0">
            {posts.map((p) => (
              <VideoCard key={p.id} post={p} liked={liked.has(p.id)} saved={saved.has(p.id)} onDeleted={(id) => setPosts((ps) => ps.filter((x) => x.id !== id))} />
            ))}
          </div>
          {!loading && posts.length === 0 && (
            <EmptyState icon={Clapperboard} title="Your feed is empty" text="Upload the first video or follow people to fill it up."
              action={<button className="btn-primary" onClick={() => setUploadType('video')}>Upload a video</button>} />
          )}
          <div ref={sentinel} className="grid h-20 place-items-center">{loading && <Spinner />}</div>
        </div>

        {suggested.length > 0 && (
          <aside className="sticky top-24 hidden h-fit w-72 shrink-0 pt-6 lg:block">
            <div className="glass-card p-3">
              <p className="px-3 pb-2 pt-1 text-sm font-bold text-fg/70">Suggested for you</p>
              {suggested.map((u) => <UserRow key={u.id} user={u} right={<FollowButton userId={u.id} compact />} />)}
            </div>
            <Link to="/explore" className="mt-3 block px-3 text-xs font-semibold text-fg/45 hover:text-fg/70">See more on Explore</Link>
          </aside>
        )}
      </div>
    </div>
  )
}
