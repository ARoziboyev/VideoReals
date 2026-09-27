import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UserRound, Shield, Bell, Palette, Lock, Globe, Users, LogOut, ChevronRight, ArrowLeft, Moon, Sun, Monitor, Check, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../components/common/Avatar'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'
import EditProfileModal from '../components/profile/EditProfileModal'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useUIStore } from '../store/uiStore'
import { updateSettings, setOnline } from '../services/profileService'
import { updatePassword, updateEmail, logout } from '../services/authService'
import * as accounts from '../services/accountService'
import { useT, LANGUAGES } from '../lib/i18n'
import { cn, errorMessage, fullName } from '../lib/utils'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-4 py-3.5 hover:bg-fg/5">
      <span><span className="block text-sm font-semibold">{label}</span>{hint && <span className="mt-0.5 block text-xs text-fg/50">{hint}</span>}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-violet-500' : 'bg-fg/20')}>
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-6' : 'left-1')} />
      </button>
    </label>
  )
}

function useSettingsSaver() {
  const { profile, setProfile } = useAuthStore()
  return async (patch, msg = 'Settings saved') => {
    try { setProfile(await updateSettings(profile, patch)); toast.success(msg) }
    catch (e) { toast.error(errorMessage(e)) }
  }
}

function AccountSection() {
  const { profile, user } = useAuthStore()
  const [edit, setEdit] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const changeEmail = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await updateEmail(email); toast.success('Check both inboxes to confirm the new email'); setEmail('') }
    catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl bg-fg/[0.04] p-4">
        <Avatar src={profile?.avatar_url} name={fullName(profile)} size={60} />
        <div className="min-w-0 flex-1"><p className="truncate font-bold">{fullName(profile)}</p><p className="truncate text-sm text-fg/55">@{profile?.username} · {user?.email}</p></div>
        <button className="btn-ghost" onClick={() => setEdit(true)}>Edit profile</button>
      </div>
      <form onSubmit={changeEmail} className="space-y-2">
        <label className="label" htmlFor="new-email">Change email</label>
        <div className="flex gap-2"><input id="new-email" type="email" required className="input" placeholder="new@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={busy}>{busy ? <Spinner size={16} className="text-white" /> : 'Update'}</button></div>
      </form>
      <EditProfileModal open={edit} onClose={() => setEdit(false)} />
    </div>
  )
}

function PrivacySection() {
  const profile = useAuthStore((s) => s.profile)
  const save = useSettingsSaver()
  const p = profile?.settings?.privacy || {}
  return (
    <div className="space-y-1">
      <Toggle label="Show online status" hint="When off, others see “last seen recently” and you don't appear online."
        checked={p.show_online_status !== false}
        onChange={async (v) => { await save({ privacy: { show_online_status: v } }); if (!v) setOnline(profile.id, false, false) }} />
      <div className="rounded-2xl px-4 py-3.5">
        <p className="text-sm font-semibold">Who can start a chat with me</p>
        <div className="mt-2.5 grid grid-cols-2 gap-1 rounded-xl bg-fg/5 p-1">
          {[['everyone', 'Everyone'], ['followers', 'People I follow']].map(([k, l]) => (
            <button key={k} onClick={() => save({ privacy: { messages: k } })} className={cn('rounded-lg py-2 text-sm font-semibold', (p.messages || 'everyone') === k ? 'bg-fg/10' : 'text-fg/55')}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

const NOTIF_LABELS = { follow: 'New followers', like: 'Likes', comment: 'Comments', reply: 'Replies', mention: 'Mentions', message: 'Messages', story_like: 'Story likes', live: 'Live videos from people you follow' }
function NotificationsSection() {
  const profile = useAuthStore((s) => s.profile)
  const save = useSettingsSaver()
  const n = profile?.settings?.notifications || {}
  return <div className="space-y-1">{Object.entries(NOTIF_LABELS).map(([k, l]) => <Toggle key={k} label={l} checked={n[k] !== false} onChange={(v) => save({ notifications: { [k]: v } })} />)}</div>
}

function AppearanceSection() {
  const t = useT()
  const { theme, setTheme } = useThemeStore()
  return (
    <div className="grid grid-cols-3 gap-3">
      {[['dark', Moon, t('dark')], ['light', Sun, t('light')], ['system', Monitor, t('system')]].map(([k, Icon, l]) => (
        <button key={k} onClick={() => setTheme(k)} className={cn('flex flex-col items-center gap-3 rounded-2xl border p-5 transition', theme === k ? 'border-violet-400 bg-violet-500/10' : 'border-line hover:bg-fg/5')}>
          <Icon size={24} /><span className="text-sm font-semibold">{l}</span>
        </button>
      ))}
    </div>
  )
}

function SecuritySection() {
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return toast.error('Password must be at least 8 characters')
    if (pw !== pw2) return toast.error('Passwords do not match')
    setBusy(true)
    try { await updatePassword(pw); toast.success('Password updated'); setPw(''); setPw2('') }
    catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm font-semibold">Change password</p>
        <input type="password" className="input" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        <input type="password" className="input" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        <button className="btn-primary" disabled={busy}>{busy ? <Spinner size={16} className="text-white" /> : 'Update password'}</button>
      </form>
      <div className="rounded-2xl border border-line p-4">
        <p className="text-sm font-semibold">Sessions</p>
        <p className="mt-1 text-xs text-fg/55">Sign out of VideoMove on every other browser and device.</p>
        <button className="btn-ghost mt-3" onClick={async () => { try { await logout('others'); toast.success('Signed out of other devices') } catch (e) { toast.error(errorMessage(e)) } }}>Sign out other devices</button>
      </div>
    </div>
  )
}

function LanguageSection() {
  const { lang, setLang } = useUIStore()
  return (
    <div className="space-y-1">
      {LANGUAGES.map((l) => (
        <button key={l.code} onClick={() => setLang(l.code)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold hover:bg-fg/5">
          {l.label}{lang === l.code && <Check size={18} className="text-violet-400" />}
        </button>
      ))}
    </div>
  )
}

function AccountsSection() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const [list, setList] = useState(accounts.getAccounts())
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(null)

  const switchTo = async (id) => {
    setBusy(id)
    try { await setOnline(user.id, false); await accounts.switchAccount(id); toast.success('Account switched'); window.location.assign('/') }
    catch (e) { toast.error(errorMessage(e)); setList(accounts.getAccounts()); setBusy(null) }
  }
  const add = async (e) => {
    e.preventDefault(); setBusy('add')
    try { await setOnline(user.id, false); await accounts.addAccount(form.email, form.password); toast.success('Account added'); window.location.assign('/') }
    catch (err) { toast.error(err.message === 'Invalid login credentials' ? 'Email or password is incorrect' : errorMessage(err)); setBusy(null) }
  }
  const remove = (id) => { accounts.removeAccount(id); setList(accounts.getAccounts()); toast.success('Account removed from this device') }

  return (
    <div className="space-y-2">
      {list.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-fg/5">
          <Avatar src={a.avatar_url} name={a.first_name || a.username || a.email} size={44} />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{a.username || a.email}</p><p className="truncate text-xs text-fg/50">{a.email}</p></div>
          {a.id === user.id ? <span className="flex items-center gap-1 text-xs font-bold text-violet-400"><Check size={15} />Active</span> : (
            <>
              <button className="btn-ghost py-1.5 text-xs" disabled={Boolean(busy)} onClick={() => switchTo(a.id)}>{busy === a.id ? <Spinner size={14} /> : 'Switch'}</button>
              <button className="icon-btn h-8 w-8" onClick={() => remove(a.id)} aria-label="Remove account"><Trash2 size={15} /></button>
            </>
          )}
        </div>
      ))}
      <button className="btn-ghost mt-2 w-full" onClick={() => setAdding(true)}><Plus size={17} />{t('addAccount')}</button>
      <Modal open={adding} onClose={() => setAdding(false)} title={t('addAccount')} size="sm">
        <form onSubmit={add} className="space-y-3 p-5">
          <input type="email" required className="input" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input type="password" required className="input" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <button className="btn-primary w-full" disabled={busy === 'add'}>{busy === 'add' ? <Spinner size={16} className="text-white" /> : 'Sign in and add'}</button>
          <p className="text-center text-xs text-fg/50">No account yet? <Link to="/register" className="font-semibold text-violet-400" onClick={async () => { await logout('local').catch(() => {}) }}>Register a new one</Link> — you can switch back after signing in again.</p>
        </form>
      </Modal>
    </div>
  )
}

export default function Settings() {
  const t = useT()
  const { section } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loggingOut, setLoggingOut] = useState(false)
  const sections = [
    ['account', UserRound, t('account'), AccountSection],
    ['privacy', Shield, t('privacy'), PrivacySection],
    ['notifications', Bell, t('notifications'), NotificationsSection],
    ['appearance', Palette, t('appearance'), AppearanceSection],
    ['security', Lock, t('security'), SecuritySection],
    ['language', Globe, t('language'), LanguageSection],
    ['accounts', Users, t('addAccount'), AccountsSection],
  ]
  const current = sections.find((s) => s[0] === section)
  useEffect(() => { if (section && !current) navigate('/settings', { replace: true }) }, [section])

  const doLogout = async () => {
    setLoggingOut(true)
    try {
      await setOnline(user.id, false)
      const switched = await accounts.logoutCurrent(user.id)
      toast.success('Logged out')
      window.location.assign(switched ? '/' : '/login')
    } catch (e) { toast.error(errorMessage(e)); setLoggingOut(false) }
  }

  const Active = current?.[3]

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6">
      <h1 className="page-title mb-5 px-1">{t('settings')}</h1>
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <nav className={cn('glass-card h-fit p-2', section && 'hidden md:block')}>
          {sections.map(([k, Icon, label]) => (
            <Link key={k} to={`/settings/${k}`} className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition', (section || (window.innerWidth >= 768 ? 'account' : '')) === k ? 'bg-fg/10' : 'text-fg/75 hover:bg-fg/5')}>
              <Icon size={19} /><span className="flex-1">{label}</span><ChevronRight size={16} className="text-fg/35 md:hidden" />
            </Link>
          ))}
          <button onClick={doLogout} disabled={loggingOut} className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10">
            {loggingOut ? <Spinner size={19} /> : <LogOut size={19} />}{t('logout')}
          </button>
        </nav>
        <section className={cn('glass-card p-4 sm:p-6', !section && 'hidden md:block')}>
          {section && <button onClick={() => navigate('/settings')} className="icon-btn -ml-2 mb-2 md:hidden" aria-label="Back"><ArrowLeft size={20} /></button>}
          <h2 className="mb-4 font-display text-lg font-semibold">{(current || sections[0])[2]}</h2>
          {Active ? <Active /> : <AccountSection />}
        </section>
      </div>
    </div>
  )
}
