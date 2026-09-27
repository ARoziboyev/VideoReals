import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthShell, { GoogleIcon } from '../../components/auth/AuthShell'
import Spinner from '../../components/common/Spinner'
import { login, loginWithGoogle, resendVerification } from '../../services/authService'
import { errorMessage } from '../../lib/utils'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [unverified, setUnverified] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setUnverified(false)
    try {
      await login(email, password)
      toast.success('Login successful')
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      if (/confirm/i.test(err.message)) setUnverified(true)
      toast.error(err.message === 'Invalid login credentials' ? 'Email or password is incorrect' : errorMessage(err))
    } finally { setBusy(false) }
  }

  const google = async () => { try { await loginWithGoogle() } catch (e) { toast.error(errorMessage(e)) } }
  const resend = async () => { try { await resendVerification(email); toast.success('Verification email sent') } catch (e) { toast.error(errorMessage(e)) } }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to VideoMove."
      footer={<>New here? <Link to="/register" className="font-bold text-violet-400 hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div>
          <div className="flex items-center justify-between"><label className="label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="mb-1.5 text-xs font-semibold text-violet-400 hover:underline">Forgot password?</Link></div>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className="input pr-11" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/50" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>
        {unverified && (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            Confirm your email first. <button type="button" onClick={resend} className="font-bold underline">Resend email</button>
          </p>
        )}
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner size={18} className="text-white" /> : 'Sign in'}</button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-fg/40"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
      <button onClick={google} className="btn-ghost w-full py-3"><GoogleIcon /> Continue with Google</button>
    </AuthShell>
  )
}
