import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Megaphone, Pause, Play, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '../common/EmptyState'
import { PageLoader } from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { fetchMyPromotions, setPromotionStatus } from '../../services/promotionService'
import { cn, errorMessage, formatCount } from '../../lib/utils'

const STATUS = { active: 'bg-emerald-500/15 text-emerald-300', paused: 'bg-amber-500/15 text-amber-300', ended: 'bg-fg/10 text-fg/50' }

export default function AdsManager() {
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState(null)
  const load = () => fetchMyPromotions(user.id).then(setItems).catch((e) => { toast.error(errorMessage(e)); setItems([]) })
  useEffect(() => { load() }, [user.id])

  const change = async (p, status) => {
    try { await setPromotionStatus(p.id, status); setItems((l) => l.map((x) => (x.id === p.id ? { ...x, status } : x))) }
    catch (e) { toast.error(errorMessage(e)) }
  }

  if (!items) return <PageLoader />
  if (!items.length) return <EmptyState icon={Megaphone} title="No ads yet" text="Open any of your posts, tap ••• and choose “Promote”." />

  return (
    <div className="space-y-3">
      {items.map((p) => {
        const ended = p.status === 'ended' || new Date(p.ends_at) < new Date()
        const status = ended ? 'ended' : p.status
        const ctr = p.impressions ? ((p.clicks / p.impressions) * 100).toFixed(1) : '0.0'
        return (
          <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-fg/[0.03] p-3 sm:flex-row sm:items-center">
            <Link to={`/p/${p.post_id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-black">
                {(p.post?.thumbnail_url || p.post?.image_url) && <img src={p.post.thumbnail_url || p.post.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.post?.caption || 'Post'}</p>
                <p className="mt-0.5 text-xs text-fg/50">{p.daily_budget.toLocaleString('ru-RU')} so‘m/day · {p.days} days · until {new Date(p.ends_at).toLocaleDateString()}</p>
                <span className={cn('chip mt-1.5', STATUS[status])}>{status}</span>
              </div>
            </Link>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Views', formatCount(p.impressions)], ['Clicks', formatCount(p.clicks)], ['CTR', `${ctr}%`]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-fg/[0.05] px-3 py-2"><p className="font-display text-sm font-semibold">{v}</p><p className="text-[10px] uppercase tracking-wider text-fg/45">{l}</p></div>
              ))}
            </div>
            {!ended && (
              <div className="flex gap-1.5">
                {p.status === 'active'
                  ? <button className="icon-btn" onClick={() => change(p, 'paused')} aria-label="Pause"><Pause size={17} /></button>
                  : <button className="icon-btn" onClick={() => change(p, 'active')} aria-label="Resume"><Play size={17} /></button>}
                <button className="icon-btn text-rose-400" onClick={() => change(p, 'ended')} aria-label="Stop"><Square size={16} /></button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}