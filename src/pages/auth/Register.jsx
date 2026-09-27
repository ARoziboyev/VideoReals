import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell, { GoogleIcon } from '../../components/auth/AuthShell'
import Avatar from '../../components/common/Avatar'
import Spinner from '../../components/common/Spinner'
import { register, loginWithGoogle, resendVerification } from '../../services/authService'
import { validateFile } from '../../services/storageService'
import { errorMessage } from '../../lib/utils'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '' })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'username' ? e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') : e.target.value }))

  const pick = (f) => {
    if (!f) return
    try { validateFile(f, 'avatars') } catch (e) { toast.error(e.message); return }
    setAvatar(f); setPreview(URL.createObjectURL(f))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setBusy(true)
    try {
      const data = await register({ ...form, avatar })
      if (data.session) { toast.success('Account created'); navigate('/', { replace: true }) }
      else setSent(true)
    } catch (err) { toast.error(errorMessage(err)) }
    finally { setBusy(false) }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${form.email}. Open it to activate your account.`}
        footer={<Link to="/login" className="font-bold text-violet-400 hover:underline">Back to sign in</Link>}>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-violet-400"><MailCheck size={30} /></span>
          <button className="btn-ghost" onClick={async () => { try { await resendVerification(form.email); toast.success('Email sent again') } catch (e) { toast.error(errorMessage(e)) } }}>Resend email</button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute."
      footer={<>Already have an account? <Link to="/login" className="font-bold text-violet-400 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-3.5">
        <label className="flex cursor-pointer items-center gap-4">
          <span className="relative">
            <Avatar src={preview} name={`${form.firstName} ${form.lastName}`} size={64} />
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-violet-500 text-white"><Camera size={14} /></span>
          </span>
          <span className="text-sm"><span className="block font-semibold">Profile photo</span><span className="text-xs text-fg/50">Optional · up to 5 MB</span></span>
          <input type="file" hidden accept="image/*" onChange={(e) => pick(e.target.files[0])} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="fn">First name</label><input id="fn" required className="input" value={form.firstName} onChange={set('firstName')} maxLength={40} autoComplete="given-name" /></div>
          <div><label className="label" htmlFor="ln">Last name</label><input id="ln" required className="input" value={form.lastName} onChange={set('lastName')} maxLength={40} autoComplete="family-name" /></div>
        </div>
        <div><label className="label" htmlFor="un">Username</label>
          <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-fg/40">@</span>
            <input id="un" required minLength={3} maxLength={30} className="input pl-8" value={form.username} onChange={set('username')} autoComplete="username" /></div></div>
        <div><label className="label" htmlFor="em">Email</label><input id="em" type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="email" /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" required minLength={8} className="input" value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="At least 8 characters" /></div>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner size={18} className="text-white" /> : 'Create account'}</button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-fg/40"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <button onClick={async () => { try { await loginWithGoogle() } catch (e) { toast.error(errorMessage(e)) } }} className="btn-ghost w-full py-3"><GoogleIcon /> Continue with Google</button>
    </AuthShell>
  )
}
