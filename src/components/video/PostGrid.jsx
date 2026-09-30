import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Play, ImageIcon, HeartHandshake } from 'lucide-react'
import { formatCount } from '../../lib/utils'

export default function PostGrid({ posts }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: Math.min(i, 15) * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <Link to={`/p/${p.id}`} className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-fg/5 sm:rounded-2xl">
            {p.thumbnail_url || p.image_url
              ? <img src={p.thumbnail_url || p.image_url} alt={p.caption || ''} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              : <video src={`${p.video_url}#t=0.5`} muted preload="metadata" className="h-full w-full object-cover" />}
            <span className="absolute right-2 top-2 flex items-center gap-1 text-white drop-shadow">
              {p.visibility === 'friends' && <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500"><HeartHandshake size={11} /></span>}
              {p.media_type === 'video' ? <Play size={16} fill="white" /> : <ImageIcon size={16} />}
            </span>
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/45 text-sm font-bold text-white opacity-0 backdrop-blur-[2px] transition duration-300 group-hover:opacity-100">
              <span className="flex items-center gap-1"><Heart size={16} fill="white" />{formatCount(p.likes_count)}</span>
              <span className="flex items-center gap-1"><MessageCircle size={16} fill="white" />{formatCount(p.comments_count)}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}