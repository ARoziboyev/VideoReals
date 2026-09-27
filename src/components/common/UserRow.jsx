import { Link } from 'react-router-dom'
import Avatar from './Avatar'
import { fullName } from '../../lib/utils'
import { useUIStore } from '../../store/uiStore'

export default function UserRow({ user, right, subtitle, onClick, to }) {
  const online = useUIStore((s) => s.onlineUsers.has(user.id))
  const content = (
    <>
      <Avatar src={user.avatar_url} name={fullName(user)} size={44} online={online} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.username}</p>
        <p className="truncate text-xs text-fg/55">{subtitle ?? fullName(user)}</p>
      </div>
    </>
  )
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-fg/5">
      {onClick
        ? <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onClick}>{content}</button>
        : <Link to={to || `/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">{content}</Link>}
      {right}
    </div>
  )
}
