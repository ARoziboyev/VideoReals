import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Heart, Eye, Trash2, Pause, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'
import Modal from '../common/Modal'
import UserRow from '../common/UserRow'
import { useAuthStore } from '../../store/authStore'
import * as storyService from '../../services/storyService'
import { errorMessage, fullName, timeAgo } from '../../lib/utils'

const IMAGE_MS = 5000

export default function StoryViewer({ groups: initialGroups, startIndex, onClose, onViewed }) {
  const user = useAuthStore((s) => s.user)
  const [groups, setGroups] = useState(initialGroups)
  const [gi, setGi] = useState(startIndex)
  const [si, setSi] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [liked, setLiked] = useState(false)
  const [viewers, setViewers] = useState(null)
  const videoRef = useRef(null)
  const group = groups[gi]
  const story = group?.stories[si]
  const own = story?.user_id === user.id

  const next = useCallback(() => {
    setProgress(0)
    if (si < group.stories.length - 1) setSi(si + 1)
    else if (gi < groups.length - 1) { setGi(gi + 1); setSi(0) }
    else onClose()
  }, [si, gi, group, groups.length, onClose])

  const prev = () => {
    setProgress(0)
    if (si > 0) setSi(si - 1)
    else if (gi > 0) { setGi(gi - 1); setSi(groups[gi - 1].stories.length - 1) }
  }

  useEffect(() => {
    if (!story) return
    if (!own) { storyService.markViewed(story.id, user.id).catch(() => {}); onViewed?.(story.id) }
    setLiked(false)
    if (!own) storyService.isStoryLiked(story.id, user.id).then(setLiked).catch(() => {})
  }, [story?.id])

  // timer for image / text stories
  useEffect(() => {
    if (!story || story.media_type === 'video' || paused || viewers) return
    const startedAt = performance.now() - progress * IMAGE_MS
    let raf
    const tick = (now) => {
      const p = (now - startedAt) / IMAGE_MS
      if (p >= 1) { next(); return }
      setProgress(p); raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [story?.id, paused, viewers, next])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    paused || viewers ? v.pause() : v.play().catch(() => {})
  }, [paused, viewers, story?.id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const toggleLike = async () => {
    const n = !liked
    setLiked(n)
    try { await storyService.setStoryLike(story.id, user.id, n) } catch (e) { setLiked(!n); toast.error(errorMessage(e)) }
  }

  const openViewers = async () => {
    setViewers([])
    try { setViewers(await storyService.fetchViewers(story.id)) } catch (e) { toast.error(errorMessage(e)); setViewers(null) }
  }

  const remove = async () => {
    try {
      await storyService.deleteStory(story)
      toast.success('Story deleted')
      const stories = group.stories.filter((s) => s.id !== story.id)
      if (!stories.length) return onClose()
      setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, stories } : g)))
      setSi((i) => Math.min(i, stories.length - 1)); setProgress(0)
    } catch (e) { toast.error(errorMessage(e)) }
  }

  if (!story) return null

  return createPortal(
    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div key={group.user?.id} initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.22 }}
        className="relative h-[100dvh] w-full overflow-hidden bg-black sm:h-[92vh] sm:max-w-[420px] sm:rounded-3xl">
        {/* progress */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full bg-white" style={{ width: i < si ? '100%' : i === si ? `${progress * 100}%` : '0%' }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-3 top-7 z-20 flex items-center gap-2.5 text-white">
          <Link to={`/u/${group.user?.username}`} onClick={onClose} className="flex items-center gap-2.5">
            <Avatar src={group.user?.avatar_url} name={fullName(group.user)} size={34} />
            <span className="text-sm font-bold">{group.user?.username}</span>
          </Link>
          <span className="text-xs text-white/60">{timeAgo(story.created_at)}</span>
          <button className="ml-auto grid h-9 w-9 place-items-center" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
          <button className="grid h-9 w-9 place-items-center" onClick={onClose} aria-label="Close"><X size={22} /></button>
        </div>

        {/* content */}
        <div className="absolute inset-0 grid place-items-center">
          {story.media_type === 'image' && <img src={story.media_url} alt="" className="max-h-full w-full object-contain" />}
          {story.media_type === 'video' && (
            <video ref={videoRef} key={story.id} src={story.media_url} autoPlay playsInline className="max-h-full w-full object-contain"
              onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))} onEnded={next} />
          )}
          {story.media_type === 'text' && (
            <div className="grid h-full w-full place-items-center p-8" style={{ background: story.background || 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}>
              <p className="whitespace-pre-wrap text-center font-display text-2xl font-semibold leading-snug text-white">{story.text_content}</p>
            </div>
          )}
          {story.media_type !== 'text' && story.text_content && (
            <p className="absolute bottom-24 left-4 right-4 rounded-2xl bg-black/45 px-4 py-2 text-center text-sm text-white backdrop-blur">{story.text_content}</p>
          )}
        </div>

        {/* tap zones */}
        <button className="absolute bottom-20 left-0 top-20 z-10 w-1/3" onClick={prev} aria-label="Previous story" />
        <button className="absolute bottom-20 right-0 top-20 z-10 w-2/3" onClick={next}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} aria-label="Next story" />

        {/* footer */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          {own ? (
            <>
              <button onClick={openViewers} className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
                <Eye size={16} /> {story.views_count} views
              </button>
              <button onClick={remove} className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur" aria-label="Delete story"><Trash2 size={18} /></button>
            </>
          ) : (
            <motion.button whileTap={{ scale: 0.8 }} onClick={toggleLike} className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur" aria-label={liked ? 'Unlike story' : 'Like story'}>
              <Heart size={22} className={liked ? 'text-pink-500' : ''} fill={liked ? 'currentColor' : 'none'} />
            </motion.button>
          )}
        </div>
      </motion.div>

      <Modal open={Boolean(viewers)} onClose={() => setViewers(null)} title="Viewed by" size="sm">
        <div className="p-2">
          {viewers?.length === 0 && <p className="py-8 text-center text-sm text-fg/50">No views yet</p>}
          {viewers?.map((v) => v.profile && <UserRow key={v.profile.id} user={v.profile} subtitle={timeAgo(v.created_at)} />)}
        </div>
      </Modal>
    </motion.div>,
    document.body,
  )
}
