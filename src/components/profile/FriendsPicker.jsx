import { useEffect, useMemo, useState } from 'react'
import { Search, Check, HeartHandshake } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { getFollowers } from '../../services/followService'
import { fetchFriends, setFriends } from '../../services/friendService'
import { useT } from '../../lib/i18n'
import { cn, errorMessage, fullName } from '../../lib/utils'

export default function FriendsPicker({ open, onClose, onSaved }) {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const [people, setPeople] = useState(null)
  const [initial, setInitial] = useState(new Set())
  const [selected, setSelected] = useState(new Set())
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setPeople(null); setQ('')
    Promise.all([getFollowers(me.id), fetchFriends(me.id)]).then(([followers, friends]) => {
      const ids = new Set(friends.map((f) => f.id))
      // current friends first, then the rest of the followers
      const merged = [...friends, ...followers.filter((f) => !ids.has(f.id))]
      setPeople(merged); setInitial(ids); setSelected(new Set(ids))
    }).catch((e) => { toast.error(errorMessage(e)); setPeople([]) })
  }, [open, me.id])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (people || []).filter((p) => !s || p.username.includes(s) || fullName(p).toLowerCase().includes(s))
  }, [people, q])

  const toggle = (id) => setSelected((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n })

  const save = async () => {
    setBusy(true)
    try {
      const add = [...selected].filter((id) => !initial.has(id))
      const remove = [...initial].filter((id) => !selected.has(id))
      await setFriends(me.id, add, remove)
      toast.success('Friends updated')
      onSaved?.(selected.size); onClose()
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={t('friends')} size="sm">
      <div className="p-4">
        <div className="mb-3 flex items-start gap-3 rounded-2xl bg-emerald-500/10 p-3 text-xs text-emerald-200/90">
          <HeartHandshake size={18} className="shrink-0 text-emerald-400" />
          Pick friends from your followers. Posts, stories and notes you share with “{t('friendsOnly')}” are visible only to them.
        </div>
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search followers" className="input pl-10" />
        </div>
        <div className="thin-scroll max-h-[48vh] overflow-y-auto">
          {!people ? <div className="grid py-10 place-items-center"><Spinner /></div>
            : filtered.length === 0 ? <p className="py-10 text-center text-sm text-fg/50">{people.length ? 'No matches' : 'You have no followers yet'}</p>
            : filtered.map((p) => {
              const on = selected.has(p.id)
              return (
                <button key={p.id} onClick={() => toggle(p.id)} className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left hover:bg-fg/5">
                  <Avatar src={p.avatar_url} name={fullName(p)} size={42} ring={on ? 'friends' : null} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.username}</span><span className="block truncate text-xs text-fg/55">{fullName(p)}</span></span>
                  <span className={cn('grid h-6 w-6 place-items-center rounded-full border transition', on ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-line')}>{on && <Check size={14} strokeWidth={3} />}</span>
                </button>
              )
            })}
        </div>
        <button className="btn mt-3 w-full bg-emerald-500 text-white hover:bg-emerald-600" disabled={busy || !people} onClick={save}>
          {busy ? <Spinner size={16} className="text-white" /> : `Save · ${selected.size}`}
        </button>
      </div>
    </Modal>
  )
}