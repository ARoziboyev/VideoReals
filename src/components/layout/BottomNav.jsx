import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Compass, Plus, MessageCircle } from 'lucide-react'
import Avatar from '../common/Avatar'
import { Badge } from './Sidebar'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useT } from '../../lib/i18n'
import { cn, fullName } from '../../lib/utils'

function Tab({ to, end, label, children }) {
  return (
    <NavLink to={to} end={end} aria-label={label} className={({ isActive }) => cn('relative grid h-12 w-12 place-items-center rounded-2xl transition-colors', isActive ? 'text-fg' : 'text-fg/55')}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="bottom-pill" transition={{ type: 'spring', stiffness: 460, damping: 34 }} className="absolute inset-0 rounded-2xl bg-fg/[0.12] shadow-[inset_0_1px_0_var(--hl)]" />}
          <span className="relative">{children}</span>
        </>
      )}
    </NavLink>
  )
}

export default function BottomNav() {
  const t = useT()
  const profile = useAuthStore((s) => s.profile)
  const setCreateOpen = useUIStore((s) => s.setCreateOpen)
  const unreadMessages = useUIStore((s) => s.unreadMessages)

  return (
    <nav className="fixed inset-x-3 z-40 flex items-center justify-around rounded-[1.6rem] px-2 py-1.5 glass-strong md:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <Tab to="/" end label={t('home')}><Home size={23} /></Tab>
      <Tab to="/explore" label={t('explore')}><Compass size={23} /></Tab>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCreateOpen(true)} aria-label={t('create')}
        className="vm-sheen grid h-12 w-14 place-items-center rounded-2xl text-white shadow-glow"
        style={{ backgroundImage: 'linear-gradient(120deg,#8B5CF6,#4F7CFF 55%,#EC4899)' }}>
        <Plus size={24} strokeWidth={2.6} />
      </motion.button>
      <Tab to="/messages" label={t('messages')}><MessageCircle size={23} /><Badge count={unreadMessages} className="absolute -right-2 -top-1.5" /></Tab>
      <Tab to={profile ? `/u/${profile.username}` : '/settings'} label={t('profile')}><Avatar src={profile?.avatar_url} name={fullName(profile)} size={26} /></Tab>
    </nav>
  )
}