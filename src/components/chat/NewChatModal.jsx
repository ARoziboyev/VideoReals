import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Check, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { searchUsers } from '../../services/profileService'
import { getFollowing } from '../../services/followService'
import { getOrCreateDM, createGroup } from '../../services/messageService'
import { cn, errorMessage, fullName } from '../../lib/utils'

export default function NewChatModal({ open, onClose }) {
  const me = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [group, setGroup] = useState(false)
  const [selected, setSelected] = useState([])
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!open) { setQ(''); setGroup(false); setSelected([]); setTitle('') } }, [open])

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = q.trim() ? await searchUsers(q) : await getFollowing(me.id)
        if (alive) setResults(data.filter((u) => u.id !== me.id))
      } catch (e) { toast.error(errorMessage(e)) }
      finally { alive && setLoading(false) }
    }, 250)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, open, me.id])

  const openDM = async (u) => {
    setBusy(true)
    try { const id = await getOrCreateDM(u.id); onClose(); navigate(`/messages/${id}`) }
    catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(false) }
  }
  const toggle = (u) => setSelected((s) => (s.some((x) => x.id === u.id) ? s.filter((x) => x.id !== u.id) : [...s, u]))
  const makeGroup = async () => {
    setBusy(true)
    try { const id = await createGroup(title, selected.map((u) => u.id)); toast.success('Group created'); onClose(); navigate(`/messages/${id}`) }
    catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={group ? 'New group' : 'New chat'} size="sm">
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-fg/5 p-1 text-sm font-semibold">
          <button onClick={() => setGroup(false)} className={cn('rounded-lg py-2', !group ? 'bg-fg/10' : 'text-fg/55')}>Direct message</button>
          <button onClick={() => setGroup(true)} className={cn('flex items-center justify-center gap-1.5 rounded-lg py-2', group ? 'bg-fg/10' : 'text-fg/55')}><Users size={15} />Group</button>
        </div>
        {group && <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Group name" className="input" />}
        {group && selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">{selected.map((u) => <button key={u.id} onClick={() => toggle(u)} className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-semibold">{u.username} ×</button>)}</div>
        )}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="input pl-10" autoFocus />
        </div>
        {!q && <p className="text-xs font-semibold text-fg/45">People you follow</p>}
        <div className="max-h-[45vh] overflow-y-auto">
          {loading ? <div className="grid py-8 place-items-center"><Spinner /></div>
            : results.length === 0 ? <p className="py-8 text-center text-sm text-fg/50">No people found</p>
            : results.map((u) => {
              const sel = selected.some((x) => x.id === u.id)
              return (
                <button key={u.id} disabled={busy} onClick={() => (group ? toggle(u) : openDM(u))} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-fg/5">
                  <Avatar src={u.avatar_url} name={fullName(u)} size={42} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{u.username}</span><span className="block truncate text-xs text-fg/55">{fullName(u)}</span></span>
                  {group && <span className={cn('grid h-6 w-6 place-items-center rounded-full border', sel ? 'border-violet-500 bg-violet-500 text-white' : 'border-line')}>{sel && <Check size={14} />}</span>}
                </button>
              )
            })}
        </div>
        {group && (
          <button className="btn-primary w-full" disabled={busy || !title.trim() || selected.length < 1} onClick={makeGroup}>
            {busy ? <Spinner size={16} className="text-white" /> : `Create group (${selected.length + 1})`}
          </button>
        )}
      </div>
    </Modal>
  )
}
