import { NavLink, Link } from 'react-router-dom'
import { Home, Clapperboard, MessageCircle, Compass, Bell, Radio, Plus, Settings } from 'lucide-react'
import Logo, { LogoMark } from '../common/Logo'
import Avatar from '../common/Avatar'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useT } from '../../lib/i18n'
import { cn, fullName } from '../../lib/utils'

const items = [
  { to: '/', icon: Home, key: 'home', end: true },
  { to: '/reels', icon: Clapperboard, key: 'reels' },
  { to: '/messages', icon: MessageCircle, key: 'messages', badge: 'unreadMessages' },
  { to: '/explore', icon: Compass, key: 'explore' },
  { to: '/notifications', icon: Bell, key: 'notifications', badge: 'unreadNotifications' },
  { to: '/live', icon: Radio, key: 'live' },
]

export function Badge({ count, className = '' }) {
  if (!count) return null
  return (
    <span className={cn('grid min-w-[18px] place-items-center rounded-full bg-pink-500 px-1 text-[10px] font-bold leading-[18px] text-white', className)}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Item({ to, icon: Icon, label, end, badge }) {
  return (
    <NavLink to={to} end={end} title={label}
      className={({ isActive }) => cn('group relative flex items-center gap-3.5 rounded-2xl px-3 py-2.5 text-[15px] font-semibold transition',
        isActive ? 'bg-fg/10 text-fg' : 'text-fg/65 hover:bg-fg/5 hover:text-fg')}>
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-pink-400" />}
          <span className="relative mx-auto xl:mx-0">
            <Icon size={23} strokeWidth={isActive ? 2.4 : 1.9} />
            {badge ? <Badge count={badge} className="absolute -right-2 -top-1.5" /> : null}
          </span>
          <span className="hidden xl:inline">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const t = useT()
  const profile = useAuthStore((s) => s.profile)
  const setCreateOpen = useUIStore((s) => s.setCreateOpen)
  const unreadMessages = useUIStore((s) => s.unreadMessages)
  const unreadNotifications = useUIStore((s) => s.unreadNotifications)
  const counts = { unreadMessages, unreadNotifications }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r border-line px-3 py-5 glass md:flex xl:w-64 xl:px-4">
      <Link to="/" className="mb-8 flex justify-center px-1 xl:justify-start" aria-label="VideoMove home">
        <span className="xl:hidden"><LogoMark size={36} /></span>
        <span className="hidden xl:inline"><Logo size={34} /></span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((i) => <Item key={i.to} {...i} label={t(i.key)} badge={i.badge ? counts[i.badge] : 0} />)}
        <button onClick={() => setCreateOpen(true)}
          className="btn-primary mt-3 h-12 rounded-2xl px-0 xl:justify-start xl:px-4" title={t('create')}>
          <Plus size={22} strokeWidth={2.5} /><span className="hidden xl:inline">{t('create')}</span>
        </button>
      </nav>
      <div className="flex flex-col gap-1">
        {profile && (
          <NavLink to={`/u/${profile.username}`}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-2xl px-3 py-2 transition', isActive ? 'bg-fg/10' : 'hover:bg-fg/5')}>
            <Avatar src={profile.avatar_url} name={fullName(profile)} size={28} className="mx-auto xl:mx-0" />
            <span className="hidden min-w-0 xl:block">
              <span className="block truncate text-sm font-semibold">{profile.username}</span>
              <span className="block truncate text-xs text-fg/50">{t('profile')}</span>
            </span>
          </NavLink>
        )}
        <Item to="/settings" icon={Settings} label={t('settings')} />
      </div>
    </aside>
  )
}
