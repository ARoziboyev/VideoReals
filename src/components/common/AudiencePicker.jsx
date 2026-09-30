import { useEffect, useState } from 'react'
import { Globe2, HeartHandshake, UserPlus } from 'lucide-react'
import FriendsPicker from '../profile/FriendsPicker'
import { useAuthStore } from '../../store/authStore'
import { fetchFriends } from '../../services/friendService'
import { useT } from '../../lib/i18n'
import { cn } from '../../lib/utils'

export default function AudiencePicker({ value, onChange }) {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const [count, setCount] = useState(null)
  const [picker, setPicker] = useState(false)

  useEffect(() => { fetchFriends(me.id).then((f) => setCount(f.length)).catch(() => setCount(0)) }, [me.id])

  const options = [
    ['public', Globe2, t('everyone'), 'Anyone on VideoMove', 'text-sky-400 bg-sky-400/15'],
    ['friends', HeartHandshake, t('friendsOnly'), count === null ? '…' : `${count} people`, 'text-emerald-400 bg-emerald-400/15'],
  ]

  return (
    <div>
      <span className="label">{t('whoCanSee')}</span>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([key, Icon, label, hint, tone]) => (
          <button key={key} type="button" onClick={() => onChange(key)}
            className={cn('flex items-center gap-3 rounded-2xl border p-3 text-left transition',
              value === key ? (key === 'friends' ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-violet-400/70 bg-violet-500/10') : 'border-line hover:bg-fg/5')}>
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tone)}><Icon size={18} /></span>
            <span className="min-w-0"><span className="block text-sm font-bold">{label}</span><span className="block truncate text-xs text-fg/50">{hint}</span></span>
          </button>
        ))}
      </div>
      {value === 'friends' && (
        <button type="button" onClick={() => setPicker(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400/40 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10">
          <UserPlus size={16} /> {t('addFriend')}
        </button>
      )}
      {value === 'friends' && count === 0 && <p className="mt-1.5 text-xs text-amber-300/90">Your friends list is empty — only you will see this.</p>}
      <FriendsPicker open={picker} onClose={() => setPicker(false)} onSaved={setCount} />
    </div>
  )
}