import { NavLink } from 'react-router-dom'
import { Home, Compass, Plus, MessageCircle } from 'lucide-react'
import Avatar from '../common/Avatar'
import { Badge } from './Sidebar'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useT } from '../../lib/i18n'
import { cn, fullName } from '../../lib/utils'

export default function BottomNav() {
  const t = useT()
  const profile = useAuthStore((s) => s.profile)
  const setCreateOpen = useUIStore((s) => s.setCreateOpen)
  const unreadMessages = useUIStore((s) => s.unreadMessages)
  const link = ({ isActive }) => cn('grid h-12 w-12 place-items-center rounded-2xl transition', isActive ? 'text-fg bg-fg/10' : 'text-fg/60')

  return (
    <nav className="fixed inset-x-3 z-40 flex items-center justify-around rounded-[1.4rem] px-2 py-1.5 glass-strong shadow-glass md:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <NavLink to="/" end className={link} aria-label={t('home')}><Home size={23} /></NavLink>
      <NavLink to="/explore" className={link} aria-label={t('explore')}><Compass size={23} /></NavLink>
      <button onClick={() => setCreateOpen(true)} aria-label={t('create')}
        className="grid h-12 w-14 place-items-center rounded-2xl text-white shadow-glow active:scale-95"
        style={{ backgroundImage: 'linear-gradient(120deg,#8B5CF6,#4F7CFF 55%,#EC4899)' }}>
        <Plus size={24} strokeWidth={2.6} />
      </button>
      <NavLink to="/messages" className={link} aria-label={t('messages')}>
        <span className="relative"><MessageCircle size={23} /><Badge count={unreadMessages} className="absolute -right-2 -top-1.5" /></span>
      </NavLink>
      <NavLink to={profile ? `/u/${profile.username}` : '/settings'} className={link} aria-label={t('profile')}>
        <Avatar src={profile?.avatar_url} name={fullName(profile)} size={26} />
      </NavLink>
    </nav>
  )
}
