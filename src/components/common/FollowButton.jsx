import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { follow, unfollow } from '../../services/followService'
import { useT } from '../../lib/i18n'
import { cn, errorMessage } from '../../lib/utils'

export default function FollowButton({ userId, initial = false, onChange, className = '', compact = false }) {
  const me = useAuthStore((s) => s.user)
  const t = useT()
  const [following, setFollowing] = useState(initial)
  const [busy, setBusy] = useState(false)
  if (!me || me.id === userId) return null
  const toggle = async (e) => {
    e.preventDefault(); e.stopPropagation()
    const next = !following
    setFollowing(next); setBusy(true); onChange?.(next)
    try { next ? await follow(me.id, userId) : await unfollow(me.id, userId) }
    catch (err) { setFollowing(!next); onChange?.(!next); toast.error(errorMessage(err)) }
    finally { setBusy(false) }
  }
  return (
    <button disabled={busy} onClick={toggle}
      className={cn(following ? 'btn-ghost' : 'btn-primary', compact && 'px-3 py-1.5 text-xs', className)}>
      {following ? t('following') : t('follow')}
    </button>
  )
}
