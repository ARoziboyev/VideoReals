import { useEffect, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import CreateMenu from './CreateMenu'
import Backdrop from '../common/Backdrop'
import UploadPostModal from '../video/UploadPostModal'
import CreateStoryModal from '../stories/CreateStoryModal'
import CallOverlay from '../call/CallOverlay'
import MiniPlayer from '../music/MiniPlayer'
import UsernameGate from '../profile/UsernameGate'
import { useAppRealtime } from '../../hooks/useAppRealtime'
import { useAuthStore } from '../../store/authStore'
import { initCallListener } from '../../services/callService'
import { cn } from '../../lib/utils'

// Keeps rendering the old page while it animates out
function PresenceOutlet() {
  const outlet = useOutlet()
  const isPresent = useIsPresent()
  const frozen = useRef(outlet)
  if (isPresent) frozen.current = outlet
  return frozen.current
}

const page = {
  initial: { opacity: 0, y: 26, scale: 0.975, filter: 'blur(14px)' },
  enter: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    transitionEnd: { filter: 'none' },
  },
  exit: { opacity: 0, y: -14, scale: 1.015, filter: 'blur(10px)', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const userId = useAuthStore((s) => s.user?.id)
  useAppRealtime()

  useEffect(() => (userId ? initCallListener(userId) : undefined), [userId])

  const liveRoom = /^\/live\/.+/.test(pathname)
  const immersive = pathname.startsWith('/reels') || liveRoom
  const inChat = /^\/messages\/.+/.test(pathname)
  const section = pathname.split('/')[1] || 'home'

  return (
    <div className="min-h-[100dvh]">
      <Backdrop />
      <Sidebar />
      <main className={cn('md:pl-20 xl:pl-[17rem]', !immersive && !inChat && 'pb-28 md:pb-0')}>
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.div key={section} variants={page} initial="initial" animate="enter" exit="exit" style={{ transformOrigin: '50% 0%' }}>
            <PresenceOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!inChat && !liveRoom && <BottomNav />}
      <MiniPlayer />
      <CreateMenu />
      <UploadPostModal />
      <CreateStoryModal />
      <CallOverlay />
      <UsernameGate />
    </div>
  )
}