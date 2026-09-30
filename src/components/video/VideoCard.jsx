import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, Play, Trash2, Link2, UserRound, Megaphone, HeartHandshake, ChevronRight, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'
import Modal from '../common/Modal'
import Caption from './Caption'
import CommentsPanel from './CommentsPanel'
import LikesModal from './LikesModal'
import ShareModal from './ShareModal'
import PromoteModal from '../ads/PromoteModal'
import { useAuthStore } from '../../store/authStore'
import * as videoService from '../../services/videoService'
import { trackPromotion } from '../../services/promotionService'
import { getOrCreateDM } from '../../services/messageService'
import { useInView } from '../../hooks/useInView'
import { useT } from '../../lib/i18n'
import { cn, errorMessage, formatCount, fullName, timeAgo } from '../../lib/utils'

export function usePostActions(post, initLiked, initSaved) {
  const user = useAuthStore((s) => s.user)
  const [liked, setLiked] = useState(initLiked)
  const [saved, setSaved] = useState(initSaved)
  const [likes, setLikes] = useState(post.likes_count || 0)
  useEffect(() => setLiked(initLiked), [initLiked])
  useEffect(() => setSaved(initSaved), [initSaved])
  useEffect(() => setLikes(post.likes_count || 0), [post.likes_count])

  const toggleLike = async (force) => {
    const next = typeof force === 'boolean' ? force : !liked
    if (next === liked) return
    setLiked(next); setLikes((c) => Math.max(0, c + (next ? 1 : -1)))
    try { await videoService.setLike(post.id, user.id, next) }
    catch (e) { setLiked(!next); setLikes((c) => c + (next ? -1 : 1)); toast.error(errorMessage(e)) }
  }
  const toggleSave = async () => {
    const next = !saved
    setSaved(next)
    try { await videoService.setSaved(post.id, user.id, next); toast.success(next ? 'Saved' : 'Removed from saved') }
    catch (e) { setSaved(!next); toast.error(errorMessage(e)) }
  }
  return { liked, saved, likes, toggleLike, toggleSave }
}

const CTA = { reach: 'Learn more', profile: 'Visit profile', messages: 'Send message' }

export default function VideoCard({ post, liked: initLiked = false, saved: initSaved = false, onDeleted, autoOpenComments = false }) {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { liked, saved, likes, toggleLike, toggleSave } = usePostActions(post, initLiked, initSaved)
  const [showComments, setShowComments] = useState(autoOpenComments)
  const [showLikes, setShowLikes] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [promote, setPromote] = useState(false)
  const [menu, setMenu] = useState(false)
  const [burst, setBurst] = useState(false)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const videoRef = useRef(null)
  const impression = useRef(false)
  const [ref, inView] = useInView({ threshold: 0.6 })
  const author = post.profiles || {}
  const isOwn = user?.id === post.user_id
  const isVideo = post.media_type === 'video'
  const sponsored = post.sponsored

  useEffect(() => {
    const v = videoRef.current
    if (v) {
      if (inView) v.play().then(() => setPaused(false)).catch(() => setPaused(true))
      else v.pause()
    }
    if (inView && sponsored && !impression.current) { impression.current = true; trackPromotion(sponsored.promotionId, 'impression').catch(() => {}) }
  }, [inView])

  const likeWithBurst = () => {
    if (!liked) { setBurst(true); setTimeout(() => setBurst(false), 750) }
    toggleLike()
  }
  const onDoubleClick = () => { setBurst(true); setTimeout(() => setBurst(false), 750); toggleLike(true) }
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPaused(false) } else { v.pause(); setPaused(true) }
  }
  const remove = async () => {
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    try { await videoService.deletePost(post); toast.success('Post deleted'); onDeleted?.(post.id) }
    catch (e) { toast.error(errorMessage(e)) }
    finally { setDeleting(false); setMenu(false) }
  }
  const ctaClick = async () => {
    trackPromotion(sponsored.promotionId, 'click').catch(() => {})
    if (sponsored.goal === 'profile') return navigate(`/u/${author.username}`)
    if (sponsored.goal === 'messages') {
      try { navigate(`/messages/${await getOrCreateDM(post.user_id)}`) } catch (e) { toast.error(errorMessage(e)) }
      return
    }
    navigate(`/p/${post.id}`)
  }

  const menuItem = 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-fg/5'

  return (
    <article ref={ref} className="glass-card overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to={`/u/${author.username}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={author.avatar_url} name={fullName(author)} size={40} ring={post.visibility === 'friends' ? 'friends' : null} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{author.username}</p>
            <p className="flex items-center gap-1.5 text-xs text-fg/50">
              {sponsored ? <span className="font-semibold text-fg/70">{t('sponsored')}</span> : timeAgo(post.created_at)}
              {post.visibility === 'friends' && <span className="chip bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300"><HeartHandshake size={11} />{t('friends')}</span>}
            </p>
          </div>
        </Link>
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="More"><MoreHorizontal size={20} /></button>
      </header>

      <div className="relative bg-black" onDoubleClick={onDoubleClick}>
        {isVideo ? (
          <>
            <video ref={videoRef} src={post.video_url} poster={post.thumbnail_url || undefined} muted={muted} loop playsInline preload="metadata"
              onClick={togglePlay} className="max-h-[78vh] w-full cursor-pointer object-contain" />
            {paused && <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-black/40 backdrop-blur"><Play size={28} className="ml-1 text-white" fill="white" /></span></div>}
            <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}
              className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </>
        ) : (
          <img src={post.image_url} alt={post.caption || 'Post'} loading="lazy" className="max-h-[78vh] w-full object-contain" />
        )}
        <AnimatePresence>
          {burst && (
            <motion.div initial={{ scale: 0.3, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 1.5, opacity: 0 }}
              className="pointer-events-none absolute inset-0 grid place-items-center">
              <Heart size={104} className="text-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,.9)]" fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {sponsored && (
        <button onClick={ctaClick} className="flex w-full items-center justify-between bg-gradient-to-r from-violet-600/90 to-sky-600/90 px-4 py-2.5 text-sm font-bold text-white">
          {CTA[sponsored.goal] || CTA.reach}<ChevronRight size={18} />
        </button>
      )}

      <div className="px-4 pb-4 pt-2.5">
        <div className="flex items-center gap-1">
          <motion.button whileTap={{ scale: 0.75 }} className="icon-btn -ml-2" onClick={likeWithBurst} aria-label={liked ? 'Unlike' : 'Like'} aria-pressed={liked}>
            <Heart size={24} className={cn('transition', liked && 'text-pink-500')} fill={liked ? 'currentColor' : 'none'} />
          </motion.button>
          <button className="icon-btn" onClick={() => setShowComments(true)} aria-label="Comments"><MessageCircle size={23} /></button>
          <button className="icon-btn" onClick={() => setShowShare(true)} aria-label={t('share')}><Send size={22} /></button>
          <motion.button whileTap={{ scale: 0.75 }} className="icon-btn -mr-2 ml-auto" onClick={toggleSave} aria-label={saved ? 'Unsave' : 'Save'} aria-pressed={saved}>
            <Bookmark size={23} fill={saved ? 'currentColor' : 'none'} />
          </motion.button>
        </div>
        <button onClick={() => likes > 0 && setShowLikes(true)} className="mt-1 text-sm font-bold hover:opacity-80">{formatCount(likes)} likes</button>
        {post.caption && (
          <div className="mt-1 text-sm">
            <Link to={`/u/${author.username}`} className="mr-1.5 font-bold">{author.username}</Link>
            <Caption text={post.caption} className="inline" />
          </div>
        )}
        {post.comments_count > 0 && (
          <button className="mt-1.5 block text-sm text-fg/50 hover:text-fg/75" onClick={() => setShowComments(true)}>
            View all {formatCount(post.comments_count)} comments
          </button>
        )}
      </div>

      <CommentsPanel post={post} open={showComments} onClose={() => setShowComments(false)} />
      <LikesModal postId={post.id} open={showLikes} onClose={() => setShowLikes(false)} />
      <ShareModal post={post} open={showShare} onClose={() => setShowShare(false)} />
      {isOwn && <PromoteModal post={post} open={promote} onClose={() => setPromote(false)} />}

      <Modal open={menu} onClose={() => setMenu(false)} title="Post options" size="sm">
        <div className="flex flex-col p-2">
          {isOwn && post.visibility !== 'friends' && (
            <button className={cn(menuItem, 'text-violet-300')} onClick={() => { setMenu(false); setPromote(true) }}><Megaphone size={18} />{t('promote')}</button>
          )}
          <button className={menuItem} onClick={() => navigate(`/u/${author.username}`)}><UserRound size={18} />Go to profile</button>
          <button className={menuItem} onClick={() => { navigator.clipboard.writeText(`${location.origin}/p/${post.id}`); toast.success('Link copied'); setMenu(false) }}><Link2 size={18} />{t('copyLink')}</button>
          <button className={menuItem} onClick={() => { videoService.downloadPost(post); setMenu(false) }}><Download size={18} />{t('download')}</button>
          <button className={menuItem} onClick={() => { toggleSave(); setMenu(false) }}><Bookmark size={18} />{saved ? 'Remove from saved' : 'Save'}</button>
          {isOwn && <button disabled={deleting} className={cn(menuItem, 'text-rose-400 hover:bg-rose-500/10')} onClick={remove}><Trash2 size={18} />{deleting ? 'Deleting…' : 'Delete post'}</button>}
        </div>
      </Modal>
    </article>
  )
}