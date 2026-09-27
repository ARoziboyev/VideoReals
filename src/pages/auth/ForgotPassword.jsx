import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthShell from '../../components/auth/AuthShell'
import Spinner from '../../components/common/Spinner'
import { sendPasswordReset } from '../../services/authService'
import { errorMessage } from '../../lib/utils'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await sendPasswordReset(email); setSent(true); toast.success('Reset link sent') }
    catch (err) { toast.error(errorMessage(err)) }
    finally { setBusy(false) }
  }
  return (
    <AuthShell title="Reset your password" subtitle={sent ? `If an account exists for ${email}, a reset link is on its way.` : 'Enter your email and we will send you a reset link.'}
      footer={<Link to="/login" className="font-bold text-violet-400 hover:underline">Back to sign in</Link>}>
      {!sent && (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="fp-email">Email</label><input id="fp-email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner size={18} className="text-white" /> : 'Send reset link'}</button>
        </form>
      )}
    </AuthShell>
  )
}
