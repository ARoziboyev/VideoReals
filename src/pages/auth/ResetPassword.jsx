import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthShell from '../../components/auth/AuthShell'
import Spinner from '../../components/common/Spinner'
import { Splash } from '../../components/auth/ProtectedRoute'
import { useAuthStore } from '../../store/authStore'
import { updatePassword } from '../../services/authService'
import { errorMessage } from '../../lib/utils'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { session, loading } = useAuthStore()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Splash />
  if (!session) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is invalid or has expired. Request a new one."
        footer={<Link to="/forgot-password" className="font-bold text-violet-400 hover:underline">Request a new link</Link>} />
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return toast.error('Password must be at least 8 characters')
    if (pw !== pw2) return toast.error('Passwords do not match')
    setBusy(true)
    try { await updatePassword(pw); toast.success('Password updated'); navigate('/', { replace: true }) }
    catch (err) { toast.error(errorMessage(err)) }
    finally { setBusy(false) }
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a password you don't use anywhere else.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" required minLength={8} className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
        <div><label className="label" htmlFor="np2">Confirm password</label><input id="np2" type="password" required className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner size={18} className="text-white" /> : 'Update password'}</button>
      </form>
    </AuthShell>
  )
}
