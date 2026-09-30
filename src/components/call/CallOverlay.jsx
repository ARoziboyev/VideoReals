import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, SwitchCamera } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'
import { useCallStore } from '../../store/callStore'
import { useMusicStore } from '../../store/musicStore'
import { acceptCall, declineCall, hangUp, toggleMute, toggleCamera, switchCamera } from '../../services/callService'
import { useT } from '../../lib/i18n'
import { cn, formatDuration, fullName } from '../../lib/utils'

function StreamVideo({ stream, muted, mirrored, className }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null }, [stream])
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} style={mirrored ? { transform: 'scaleX(-1)' } : undefined} />
}

function StreamAudio({ stream }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null }, [stream])
  return <audio ref={ref} autoPlay />
}

function Timer({ since }) {
  const [, tick] = useState(0)
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(i) }, [])
  return <>{formatDuration((Date.now() - since) / 1000)}</>
}

function RoundButton({ onClick, label, danger, active, children, size = 'md' }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button whileTap={{ scale: 0.88 }} onClick={onClick} aria-label={label}
        className={cn('grid place-items-center rounded-full text-white backdrop-blur-xl transition',
          size === 'lg' ? 'h-16 w-16' : 'h-14 w-14',
          danger ? 'bg-rose-500 shadow-[0_10px_30px_-8px_rgba(244,63,94,.8)] hover:bg-rose-600'
            : active ? 'bg-white text-slate-900' : 'bg-white/15 hover:bg-white/25 border border-white/15')}>
        {children}
      </motion.button>
      <span className="text-[11px] font-semibold text-white/75">{label}</span>
    </div>
  )
}

export default function CallOverlay() {
  const t = useT()
  const call = useCallStore()
  const { status, kind, peer, localStream, remoteStream, muted, cameraOff, startedAt, endReason, facing } = call
  const isVideo = kind === 'video'

  // Pause background music during calls
  useEffect(() => { if (status !== 'idle') useMusicStore.getState().setPlaying(false) }, [status])

  const safe = (fn) => async () => { try { await fn() } catch (e) { toast.error(e.message) } }

  const statusText = {
    outgoing: 'Calling…',
    connecting: 'Connecting…',
    incoming: isVideo ? t('videoCall') : t('voiceCall'),
    ended: { declined: 'Call declined', busy: 'User is busy', missed: 'No answer', failed: 'Connection lost' }[endReason] || 'Call ended',
  }[status]

  const content = status === 'idle' ? null : status === 'incoming' ? (
    <motion.div key="incoming" initial={{ y: -40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="fixed inset-x-3 top-3 z-[120] mx-auto max-w-md overflow-hidden rounded-[2rem] glass-strong p-5 text-fg sm:top-6"
      style={{ marginTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center gap-4">
        <div className="vm-pulse relative rounded-full"><Avatar src={peer?.avatar_url} name={fullName(peer)} size={60} /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold">{fullName(peer)}</p>
          <p className="flex items-center gap-1.5 text-sm text-fg/60">{isVideo ? <Video size={14} /> : <Phone size={14} />}{statusText}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={declineCall} className="btn bg-rose-500 py-3 text-white hover:bg-rose-600"><PhoneOff size={18} /> Decline</button>
        <button onClick={safe(acceptCall)} className="btn bg-emerald-500 py-3 text-white hover:bg-emerald-600">{isVideo ? <Video size={18} /> : <Phone size={18} />} Accept</button>
      </div>
    </motion.div>
  ) : (
    <motion.div key="active" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[120] overflow-hidden bg-[#05060f] text-white">
      {/* background */}
      {isVideo && remoteStream && status === 'active'
        ? <StreamVideo stream={remoteStream} className="absolute inset-0 h-full w-full object-cover" />
        : (
          <>
            {peer?.avatar_url && <img src={peer.avatar_url} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-3xl" />}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-900/40 via-transparent to-black/70" />
          </>
        )}
      {!isVideo && <StreamAudio stream={remoteStream} />}

      {/* header */}
      <div className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-16 text-center" style={{ paddingTop: 'max(4rem, calc(env(safe-area-inset-top) + 2rem))' }}>
        {!(isVideo && remoteStream && status === 'active') && (
          <div className={cn('relative mb-5 rounded-full', status !== 'active' && status !== 'ended' && 'vm-pulse')}>
            <Avatar src={peer?.avatar_url} name={fullName(peer)} size={120} />
          </div>
        )}
        <p className="font-display text-2xl font-semibold drop-shadow">{fullName(peer)}</p>
        <p className="mt-1 text-sm font-semibold text-white/70 drop-shadow">
          {status === 'active' && startedAt ? <Timer since={startedAt} /> : statusText}
        </p>
      </div>

      {/* self preview */}
      {isVideo && localStream && status !== 'ended' && (
        <motion.div drag dragMomentum={false} dragElastic={0.1}
          className="absolute right-4 top-4 z-10 h-44 w-28 cursor-grab overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl sm:h-56 sm:w-36"
          style={{ marginTop: 'env(safe-area-inset-top)' }}>
          {cameraOff ? <div className="grid h-full place-items-center text-white/60"><VideoOff size={22} /></div>
            : <StreamVideo stream={localStream} muted mirrored={facing === 'user'} className="h-full w-full object-cover" />}
        </motion.div>
      )}

      {/* controls */}
      {status !== 'ended' && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-10" style={{ paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
          <div className="flex items-end gap-4 rounded-[2rem] border border-white/10 bg-black/30 px-6 py-4 backdrop-blur-2xl sm:gap-6">
            <RoundButton onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'} active={muted}>{muted ? <MicOff size={22} /> : <Mic size={22} />}</RoundButton>
            {isVideo && <RoundButton onClick={toggleCamera} label={cameraOff ? 'Camera on' : 'Camera off'} active={cameraOff}>{cameraOff ? <VideoOff size={22} /> : <Video size={22} />}</RoundButton>}
            {isVideo && <RoundButton onClick={safe(switchCamera)} label="Flip"><SwitchCamera size={22} /></RoundButton>}
            <RoundButton onClick={hangUp} label="End" danger size="lg"><PhoneOff size={26} /></RoundButton>
          </div>
        </div>
      )}
    </motion.div>
  )

  return createPortal(<AnimatePresence>{content}</AnimatePresence>, document.body)
}