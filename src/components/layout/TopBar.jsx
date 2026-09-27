import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Search, Clapperboard, Radio } from 'lucide-react'
import Logo from '../common/Logo'
import Avatar from '../common/Avatar'
import { Badge } from './Sidebar'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useT } from '../../lib/i18n'
import { fullName } from '../../lib/utils'

export default function TopBar() {
  const t = useT()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const unread = useUIStore((s) => s.unreadNotifications)
  const [q, setQ] = useState('')

  return (
    <header className="sticky top-0 z-30 border-b border-line glass">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
        <Link to="/" className="md:hidden"><Logo size={30} /></Link>
        <form className="relative hidden flex-1 md:block" onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(q)}`) }}>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t('search')}: people, videos, #tags`}
            className="input rounded-2xl py-2.5 pl-10" aria-label={t('search')} />
        </form>
        <div className="ml-auto flex items-center gap-1">
          <Link to="/explore" className="icon-btn md:hidden" aria-label={t('search')}><Search size={21} /></Link>
          <Link to="/reels" className="icon-btn md:hidden" aria-label={t('reels')}><Clapperboard size={21} /></Link>
          <Link to="/live" className="icon-btn md:hidden" aria-label={t('live')}><Radio size={21} /></Link>
          <Link to="/notifications" className="icon-btn relative" aria-label={t('notifications')}>
            <Bell size={21} /><Badge count={unread} className="absolute right-1 top-1" />
          </Link>
          {profile && (
            <Link to={`/u/${profile.username}`} className="ml-1 hidden md:block" aria-label={t('profile')}>
              <Avatar src={profile.avatar_url} name={fullName(profile)} size={34} />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
