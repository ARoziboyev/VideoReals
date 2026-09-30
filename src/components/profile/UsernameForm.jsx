import { useEffect, useState } from 'react'
import { AtSign, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { isUsernameAvailable, updateProfile } from '../../services/profileService'
import { saveAccount } from '../../services/accountService'
import { cn, errorMessage } from '../../lib/utils'

const RULE = /^[a-z0-9_.]{3,30}$/

export default function UsernameForm({ onDone, submitLabel = 'Save' }) {
  const { profile, setProfile, session } = useAuthStore()
  const [value, setValue] = useState(profile?.username || '')
  const [state, setState] = useState('idle') // idle | checking | ok | taken | invalid
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (value === profile?.username) { setState('ok'); return }
    if (!RULE.test(value)) { setState(value ? 'invalid' : 'idle'); return }
    setState('checking')
    const timer = setTimeout(async () => setState((await isUsernameAvailable(value, profile.id)) ? 'ok' : 'taken'), 350)
    return () => clearTimeout(timer)
  }, [value, profile?.username, profile?.id])

  const save = async (e) => {
    e.preventDefault()
    if (state !== 'ok') return
    setBusy(true)
    try {
      const p = await updateProfile(profile.id, { username: value, username_confirmed: true })
      setProfile(p); saveAccount(session, p)
      toast.success('Username saved')
      onDone?.(p)
    } catch (err) { toast.error(errorMessage(err)) }
    finally { setBusy(false) }
  }

  const hint = {
    invalid: ['3–30 characters: a–z, 0–9, “_” and “.”', 'text-amber-300'],
    taken: ['This username is taken', 'text-rose-400'],
    ok: [value === profile?.username ? 'This is your current username' : 'Available', 'text-emerald-400'],
    checking: ['Checking…', 'text-fg/50'],
    idle: ['Letters, numbers, “_” and “.”', 'text-fg/50'],
  }[state]

  return (
    <form onSubmit={save} className="space-y-2">
      <div className="relative">
        <AtSign size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/45" />
        <input value={value} onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30))}
          className="input pl-10 pr-10 text-base font-semibold" aria-label="Username" autoFocus />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {state === 'checking' ? <Spinner size={16} /> : state === 'ok' ? <Check size={17} className="text-emerald-400" /> : state === 'taken' || state === 'invalid' ? <X size={17} className="text-rose-400" /> : null}
        </span>
      </div>
      <p className={cn('text-xs', hint[1])}>{hint[0]}</p>
      <p className="text-xs text-fg/45">Your profile link: {window.location.host}/u/{value || 'username'}</p>
      <button className="btn-primary w-full" disabled={state !== 'ok' || busy}>{busy ? <Spinner size={16} className="text-white" /> : submitLabel}</button>
    </form>
  )
}