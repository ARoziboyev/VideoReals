import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video, CircleDashed, Radio, ImageIcon } from 'lucide-react'
import Modal from '../common/Modal'
import { useUIStore } from '../../store/uiStore'
import { useT } from '../../lib/i18n'

export default function CreateMenu() {
  const t = useT()
  const navigate = useNavigate()
  const { createOpen, setCreateOpen, setUploadType, setStoryOpen } = useUIStore()
  const options = [
    { icon: Video, label: t('uploadVideo'), hint: 'MP4 or WebM, up to 50 MB', color: '#8B5CF6', onClick: () => setUploadType('video') },
    { icon: CircleDashed, label: t('createStory'), hint: 'Photo, video or text for 24 hours', color: '#EC4899', onClick: () => setStoryOpen(true) },
    { icon: Radio, label: t('startLive'), hint: 'Go live with your camera', color: '#F43F5E', onClick: () => { setCreateOpen(false); navigate('/live/new') } },
    { icon: ImageIcon, label: t('uploadImage'), hint: 'JPG, PNG or WebP, up to 15 MB', color: '#4F7CFF', onClick: () => setUploadType('image') },
  ]
  return (
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('create')} size="sm">
      <div className="grid grid-cols-2 gap-3 p-4">
        {options.map((o, i) => (
          <motion.button key={o.label} onClick={o.onClick}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-line bg-fg/[0.03] p-4 text-left transition hover:bg-fg/[0.07]">
            <span className="grid h-11 w-11 place-items-center rounded-xl transition group-hover:scale-105"
              style={{ background: `${o.color}26`, color: o.color, boxShadow: `0 0 24px -6px ${o.color}` }}>
              <o.icon size={21} />
            </span>
            <span>
              <span className="block text-sm font-bold">{o.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-fg/50">{o.hint}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </Modal>
  )
}
