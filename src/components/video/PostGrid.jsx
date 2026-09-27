import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Play, ImageIcon } from 'lucide-react'
import { formatCount } from '../../lib/utils'

export default function PostGrid({ posts }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((p) => (
        <Link key={p.id} to={`/p/${p.id}`} className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-fg/5 sm:rounded-xl">
          {p.thumbnail_url || p.image_url
            ? <img src={p.thumbnail_url || p.image_url} alt={p.caption || ''} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            : <video src={`${p.video_url}#t=0.5`} muted preload="metadata" className="h-full w-full object-cover" />}
          <span className="absolute right-2 top-2 text-white drop-shadow">{p.media_type === 'video' ? <Play size={16} fill="white" /> : <ImageIcon size={16} />}</span>
          <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/45 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
            <span className="flex items-center gap-1"><Heart size={16} fill="white" />{formatCount(p.likes_count)}</span>
            <span className="flex items-center gap-1"><MessageCircle size={16} fill="white" />{formatCount(p.comments_count)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
