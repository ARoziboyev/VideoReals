import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import CreateMenu from './CreateMenu'
import Backdrop from '../common/Backdrop'
import UploadPostModal from '../video/UploadPostModal'
import CreateStoryModal from '../stories/CreateStoryModal'
import { useAppRealtime } from '../../hooks/useAppRealtime'
import { cn } from '../../lib/utils'

export default function AppLayout() {
  const { pathname } = useLocation()
  useAppRealtime()
  const immersive = pathname.startsWith('/reels') || /^\/live\/.+/.test(pathname)
  const inChat = /^\/messages\/.+/.test(pathname)
  const section = pathname.split('/')[1] || 'home'

  return (
    <div className="min-h-[100dvh]">
      <Backdrop />
      <Sidebar />
      <main className={cn('md:pl-20 xl:pl-64', !immersive && !inChat && 'pb-28 md:pb-0')}>
        <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          <Outlet />
        </motion.div>
      </main>
      {!inChat && <BottomNav />}
      <CreateMenu />
      <UploadPostModal />
      <CreateStoryModal />
    </div>
  )
}
