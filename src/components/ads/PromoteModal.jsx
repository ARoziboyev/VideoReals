import { useEffect, useState } from 'react'
import { Megaphone, Eye, UserRound, MessageCircle, Globe2, Users, Hash, X, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { createPromotion, estimateReach } from '../../services/promotionService'
import { useT } from '../../lib/i18n'
import { cn, errorMessage, formatCount } from '../../lib/utils'

const GOALS = [
  ['reach', Eye, 'More views', 'Show the post to more people'],
  ['profile', UserRound, 'Profile visits', 'Bring people to your profile'],
  ['messages', MessageCircle, 'More messages', 'Let people DM you in one tap'],
]
const AUDIENCES = [
  ['everyone', Globe2, 'Everyone', 'All VideoMove users'],
  ['followers', Users, 'Followers', 'People who follow you'],
  ['interests', Hash, 'By interests', 'People who like these hashtags'],
]
const som = (n) => `${n.toLocaleString('ru-RU')} so‘m`

function Option({ active, onClick, icon: Icon, title, hint }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex items-center gap-3 rounded-2xl border p-3 text-left transition', active ? 'border-violet-400/70 bg-violet-500/10' : 'border-line hover:bg-fg/5')}>
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', active ? 'bg-violet-500 text-white' : 'bg-fg/10 text-fg/70')}><Icon size={17} /></span>
      <span className="min-w-0"><span className="block text-sm font-bold">{title}</span><span className="block text-xs text-fg/50">{hint}</span></span>
    </button>
  )
}

export default function PromoteModal({ post, open, onClose }) {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [goal, setGoal] = useState('reach')
  const [audience, setAudience] = useState('everyone')
  const [interests, setInterests] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [budget, setBudget] = useState(30000)
  const [days, setDays] = useState(5)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) { setInterests(post.hashtags?.slice(0, 5) || []); setGoal('reach'); setAudience('everyone') } }, [open, post.id])

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase()
    if (tag && !interests.includes(tag) && interests.length < 10) setInterests([...interests, tag])
    setTagInput('')
  }
  const est = estimateReach(budget, days)

  const submit = async () => {
    if (post.visibility === 'friends') return toast.error('Friends-only posts cannot be promoted')
    if (audience === 'interests' && !interests.length) return toast.error('Add at least one hashtag')
    setBusy(true)
    try {
      await createPromotion({ postId: post.id, userId: user.id, goal, audience, interests, dailyBudget: budget, days })
      toast.success('Your ad is live')
      onClose()
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={t('promote')} size="lg">
      <div className="grid gap-6 p-5 md:grid-cols-[200px_1fr]">
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-2xl bg-black">
            {post.thumbnail_url || post.image_url
              ? <img src={post.thumbnail_url || post.image_url} alt="" className="aspect-[3/4] w-full object-cover" />
              : <video src={`${post.video_url}#t=0.5`} muted className="aspect-[3/4] w-full object-cover" />}
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-fg/55">{post.caption}</p>
        </div>
        <div className="space-y-5">
          <div><span className="label">Goal</span><div className="grid gap-2 sm:grid-cols-3">{GOALS.map(([k, I, ti, h]) => <Option key={k} active={goal === k} onClick={() => setGoal(k)} icon={I} title={ti} hint={h} />)}</div></div>
          <div>
            <span className="label">Audience</span>
            <div className="grid gap-2 sm:grid-cols-3">{AUDIENCES.map(([k, I, ti, h]) => <Option key={k} active={audience === k} onClick={() => setAudience(k)} icon={I} title={ti} hint={h} />)}</div>
            {audience === 'interests' && (
              <div className="mt-2 rounded-2xl bg-fg/[0.04] p-3">
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((tag) => (
                    <span key={tag} className="chip bg-sky-400/15 text-sky-300">#{tag}<button onClick={() => setInterests(interests.filter((x) => x !== tag))} aria-label={`Remove ${tag}`}><X size={12} /></button></span>
                  ))}
                </div>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                  onBlur={addTag} placeholder="Add a hashtag and press Enter" className="input mt-2 py-2" />
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between"><span className="label">Daily budget</span><span className="text-sm font-bold">{som(budget)}</span></div>
              <input type="range" className="vm-range w-full" min={10000} max={500000} step={5000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            </div>
            <div>
              <div className="flex justify-between"><span className="label">Duration</span><span className="text-sm font-bold">{days} days</span></div>
              <input type="range" className="vm-range w-full" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </div>
          </div>
          <div className="glass-edge rounded-2xl bg-gradient-to-br from-violet-500/15 to-pink-500/10 p-4">
            <div className="flex items-center justify-between text-sm"><span className="text-fg/60">Estimated reach</span><span className="font-display font-semibold">{formatCount(est.min)} – {formatCount(est.max)} people</span></div>
            <div className="mt-1 flex items-center justify-between text-sm"><span className="text-fg/60">Total</span><span className="font-display font-semibold">{som(est.total)}</span></div>
          </div>
          <p className="flex items-start gap-2 text-xs text-amber-200/80"><Info size={14} className="mt-0.5 shrink-0" />Payments (Payme / Click) are not connected yet, so ads run free in test mode.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn-primary min-w-[150px]" onClick={submit} disabled={busy}>{busy ? <Spinner size={16} className="text-white" /> : <><Megaphone size={16} />Start ad</>}</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}