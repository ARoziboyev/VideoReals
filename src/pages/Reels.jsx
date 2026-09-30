import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Play, Clapperboard, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import Avatar from '../components/common/Avatar'
import FollowButton from '../components/common/FollowButton'
import EmptyState from '../components/common/EmptyState'
import Spinner from '../components/common/Spinner'
import Caption from '../components/video/Caption'
import CommentsPanel from '../components/video/CommentsPanel'
import { usePostActions } from '../components/video/VideoCard'
import LikesModal from '../components/video/LikesModal'
import ShareModal from '../components/video/ShareModal'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { useInView } from '../hooks/useInView'
import * as videoService from '../services/videoService'
import { getFollowingSet } from '../services/followService'
import { cn, errorMessage, formatCount, fullName } from '../lib/utils'

function ReelItem({ post, liked: l, saved: s, following, muted, setMuted }) {
  const { liked, saved, likes, toggleLike, toggleSave } = usePostActions(post, l, s)
  const [ref, inView] = useInView({ threshold: 0.7 })
  const vRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const [burst, setBurst] = useState(false)
  const [comments, setComments] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const lastTap = useRef(0)
  const author = post.profiles || {}

  useEffect(() => {
    const v = vRef.current
    if (!v) return
    if (inView) { v.currentTime = 0; v.play().then(() => setPaused(false)).catch(() => setPaused(true)) } else v.pause()
  }, [inView])

  const onTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 280) {
      setBurst(true); setTimeout(() => setBurst(false), 700); toggleLike(true)
    } else {
      setTimeout(() => {
        if (Date.now() - lastTap.current >= 280) {
          const v = vRef.current
          if (v.paused) { v.play(); setPaused(false) } else { v.pause(); setPaused(true) }
        }
      }, 290)
    }
    lastTap.current = now
  }

  const Action = ({ icon: Icon, label, onClick, onLabelClick, active, activeClass }) => (
    <div className="flex flex-col items-center gap-1 text-white">
      <motion.button whileTap={{ scale: 0.8 }} onClick={onClick} aria-label={typeof label === 'string' ? label : undefined}
        className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl">
        <Icon size={25} className={cn(active && activeClass)} fill={active ? 'currentColor' : 'none'} />
      </motion.button>
      <button onClick={onLabelClick || onClick} className="text-xs font-bold drop-shadow">{label}</button>
    </div>
  )

  return (
    <section ref={ref} className="relative flex h-[100dvh] snap-start snap-always items-center justify-center">
      <div className="relative h-full w-full overflow-hidden bg-black md:h-[94vh] md:max-w-[440px] md:rounded-3xl">
        <video ref={vRef} src={post.video_url} poster={post.thumbnail_url || undefined} loop playsInline muted={muted} preload="metadata"
          onClick={onTap} className="h-full w-full cursor-pointer object-cover" />
        {paused && <div className="pointer-events-none absolute inset-0 grid place-items-center"><Play size={64} className="text-white/85" fill="currentColor" /></div>}
        <AnimatePresence>{burst && (
          <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center">
            <Heart size={110} className="text-pink-500" fill="currentColor" />
          </motion.div>)}
        </AnimatePresence>
        <button onClick={() => setMuted(!muted)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur" aria-label={muted ? 'Unmute' : 'Mute'} style={{ marginTop: 'env(safe-area-inset-top)' }}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-24 left-4 right-20 text-white md:bottom-6">
          <div className="flex items-center gap-2.5">
            <Link to={`/u/${author.username}`} className="flex items-center gap-2.5">
              <Avatar src={author.avatar_url} name={fullName(author)} size={38} />
              <span className="font-bold drop-shadow">{author.username}</span>
            </Link>
            <FollowButton userId={post.user_id} initial={following} compact className="!bg-white/15 !bg-none backdrop-blur" />
          </div>
          {post.caption && <Caption text={post.caption} className="mt-2.5 line-clamp-3 text-sm drop-shadow" />}
        </div>
        <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 md:bottom-6">
          <Action icon={Heart} label={formatCount(likes)} onClick={() => toggleLike()} onLabelClick={() => likes > 0 && setShowLikes(true)} active={liked} activeClass="text-pink-500" />
          <Action icon={MessageCircle} label={formatCount(post.comments_count)} onClick={() => setComments(true)} />
          <Action icon={Bookmark} label="Save" onClick={toggleSave} active={saved} />
          <Action icon={Send} label="Share" onClick={() => setShowShare(true)} />
        </div>
      </div>
      <CommentsPanel post={post} open={comments} onClose={() => setComments(false)} />
      <LikesModal postId={post.id} open={showLikes} onClose={() => setShowLikes(false)} />
      <ShareModal post={post} open={showShare} onClose={() => setShowShare(false)} />
    </section>
  )
}

export default function Reels() {
  const user = useAuthStore((s) => s.user)
  const setUploadType = useUIStore((s) => s.setUploadType)
  const [posts, setPosts] = useState([])
  const [inter, setInter] = useState({ liked: new Set(), saved: new Set(), following: new Set() })
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [muted, setMuted] = useState(true)
  const containerRef = useRef(null)
  const [sentinel, near] = useInView({ threshold: 0, rootMargin: '200%' })

  const load = async (reset) => {
    setLoading(true)
    try {
      const data = await videoService.fetchFeed({ mediaType: 'video', before: reset ? null : posts.at(-1)?.created_at, limit: 6 })
      const [i, f] = await Promise.all([
        videoService.getInteractions(data.map((p) => p.id), user.id),
        getFollowingSet(user.id, [...new Set(data.map((p) => p.user_id))]),
      ])
      setInter((s) => ({ liked: new Set([...s.liked, ...i.liked]), saved: new Set([...s.saved, ...i.saved]), following: new Set([...s.following, ...f]) }))
      setPosts((p) => (reset ? data : [...p, ...data]))
      setHasMore(data.length === 6)
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { load(true) }, [])
  useEffect(() => { if (near && hasMore && !loading) load(false) }, [near])

  useEffect(() => {
    const ch = supabase.channel('reels-posts').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, ({ new: n }) => {
      setPosts((ps) => ps.map((x) => (x.id === n.id ? { ...x, ...n } : x)))
    }).subscribe()
    const onKey = (e) => {
      const el = containerRef.current
      if (!el || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
      if (e.key === 'ArrowDown') { e.preventDefault(); el.scrollBy({ top: el.clientHeight, behavior: 'smooth' }) }
      if (e.key === 'ArrowUp') { e.preventDefault(); el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' }) }
    }
    window.addEventListener('keydown', onKey)
    return () => { supabase.removeChannel(ch); window.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <div ref={containerRef} className="scrollbar-none h-[100dvh] snap-y snap-mandatory overflow-y-scroll">
      <Link to="/" className="fixed left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur md:hidden" aria-label="Back" style={{ marginTop: 'env(safe-area-inset-top)' }}><ArrowLeft size={20} /></Link>
      {posts.map((p) => (
        <ReelItem key={p.id} post={p} liked={inter.liked.has(p.id)} saved={inter.saved.has(p.id)} following={inter.following.has(p.user_id)} muted={muted} setMuted={setMuted} />
      ))}
      {!loading && posts.length === 0 && (
        <div className="grid h-full place-items-center"><EmptyState icon={Clapperboard} title="No reels yet" text="Short vertical videos appear here." action={<button className="btn-primary" onClick={() => setUploadType('video')}>Upload a video</button>} /></div>
      )}
      <div ref={sentinel} className="grid h-24 place-items-center">{loading && <Spinner />}</div>
    </div>
  )
}