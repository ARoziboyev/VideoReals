import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import Avatar from '../components/common/Avatar'
import EmptyState from '../components/common/EmptyState'
import { PageLoader } from '../components/common/Spinner'
import { fetchActiveStreams } from '../services/liveService'
import { useT } from '../lib/i18n'
import { errorMessage, formatCount, fullName, timeAgo } from '../lib/utils'

export default function Live() {
  const t = useT()
  const [streams, setStreams] = useState(null)

  useEffect(() => {
    const load = () => fetchActiveStreams().then(setStreams).catch((e) => { toast.error(errorMessage(e)); setStreams([]) })
    load()
    const ch = supabase.channel('live-list').on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6">
      <div className="mb-5 flex items-center justify-between px-1">
        <h1 className="page-title">{t('live')}</h1>
        <Link to="/live/new" className="btn-primary"><Radio size={17} />{t('startLive')}</Link>
      </div>
      {!streams ? <PageLoader /> : streams.length === 0 ? (
        <EmptyState icon={Radio} title="Nobody is live right now" text="Start a stream and your followers get notified." action={<Link to="/live/new" className="btn-primary">{t('startLive')}</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {streams.map((s) => (
            <Link key={s.id} to={`/live/${s.id}`} className="group relative aspect-[3/4] overflow-hidden rounded-3xl glass">
              <div className="absolute inset-0 grid place-items-center" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%,rgba(139,92,246,.45),transparent 60%),radial-gradient(circle at 80% 90%,rgba(236,72,153,.35),transparent 55%)' }}>
                <Avatar src={s.profiles?.avatar_url} name={fullName(s.profiles)} size={84} ring="active" className="transition group-hover:scale-105" />
              </div>
              <div className="absolute left-3 top-3 flex items-center gap-1.5">
                <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold text-white">LIVE</span>
                <span className="flex items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur"><Eye size={12} />{formatCount(s.viewer_count)}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-white">
                <p className="truncate text-sm font-bold">{s.title || `${s.profiles?.username} is live`}</p>
                <p className="truncate text-xs text-white/70">@{s.profiles?.username} · started {timeAgo(s.started_at)} ago</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
