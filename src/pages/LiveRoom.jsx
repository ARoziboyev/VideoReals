import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Eye, Radio, SendHorizontal, Mic, MicOff, Video, VideoOff, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import Avatar from '../components/common/Avatar'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'
import * as live from '../services/liveService'
import { errorMessage, fullName } from '../lib/utils'

const REACTIONS = ['❤️', '🔥', '😂', '👏', '😮']

export default function LiveRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const myProfile = useAuthStore((s) => s.profile)
  const isNew = id === 'new'

  const [stream, setStream] = useState(null)
  const [phase, setPhase] = useState(isNew ? 'preview' : 'loading') // preview | loading | live | watching | ended
  const [title, setTitle] = useState('')
  const [viewers, setViewers] = useState(0)
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [floating, setFloating] = useState([])
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [connected, setConnected] = useState(false)

  const videoRef = useRef(null)
  const localStream = useRef(null)
  const channelRef = useRef(null)
  const peers = useRef(new Map())
  const viewerPc = useRef(null)
  const pendingIce = useRef([])
  const commentsEnd = useRef(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const addFloating = (emoji) => {
    const key = crypto.randomUUID()
    setFloating((f) => [...f, { key, emoji, x: 10 + Math.random() * 60 }])
    setTimeout(() => setFloating((f) => f.filter((x) => x.key !== key)), 2500)
  }

  const cleanup = () => {
    peers.current.forEach((pc) => pc.close()); peers.current.clear()
    viewerPc.current?.close(); viewerPc.current = null
    localStream.current?.getTracks().forEach((t) => t.stop()); localStream.current = null
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
  }

  const getMedia = async () => {
    const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true })
    localStream.current = media
    if (videoRef.current) { videoRef.current.srcObject = media; videoRef.current.muted = true }
    return media
  }

  // Camera preview for a new stream
  useEffect(() => {
    if (!isNew) return
    getMedia().catch(() => { toast.error('Camera or microphone access was denied'); navigate('/live') })
    return cleanup
  }, [])

  // Load an existing stream
  useEffect(() => {
    if (isNew) return
    let alive = true
    live.fetchStream(id).then(async (s) => {
      if (!alive) return
      if (!s || !s.is_active) { setStream(s); setPhase('ended'); return }
      setStream(s)
      if (s.host_id === me.id) {
        try { await getMedia(); setupChannel(s, 'host'); setPhase('live') }
        catch { toast.error('Camera access is needed to continue your live'); setPhase('ended') }
      } else { setupChannel(s, 'viewer'); setPhase('watching') }
    }).catch((e) => { toast.error(errorMessage(e)); setPhase('ended') })
    return () => { alive = false; cleanup() }
  }, [id])

  // Comments
  useEffect(() => {
    if (!stream?.id) return
    live.fetchLiveComments(stream.id).then(setComments).catch(() => {})
    const ch = supabase.channel(`live-db-${stream.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_comments', filter: `stream_id=eq.${stream.id}` }, async ({ new: c }) => {
        const { data: p } = await supabase.from('profiles').select('id,username,avatar_url').eq('id', c.user_id).maybeSingle()
        setComments((l) => [...l.slice(-80), { ...c, profiles: p }])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_streams', filter: `id=eq.${stream.id}` }, ({ new: s }) => {
        if (!s.is_active && phaseRef.current === 'watching') { setPhase('ended'); cleanup() }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [stream?.id])

  useEffect(() => { commentsEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments.length])

  function setupChannel(s, role) {
    const ch = supabase.channel(`live-${s.id}`, { config: { broadcast: { self: false }, presence: { key: me.id } } })
    const send = (payload) => ch.send({ type: 'broadcast', event: 'signal', payload: { ...payload, from: me.id } })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      const n = Object.values(state).filter((arr) => arr.some((m) => m.role === 'viewer')).length
      setViewers(n)
      if (role === 'host') live.setViewerCount(s.id, n)
    })
    ch.on('broadcast', { event: 'reaction' }, ({ payload }) => addFloating(payload.emoji))

    if (role === 'host') {
      ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (payload.to !== me.id) return
        const from = payload.from
        if (payload.type === 'join') {
          peers.current.get(from)?.close()
          const pc = new RTCPeerConnection({ iceServers: live.ICE_SERVERS })
          localStream.current?.getTracks().forEach((t) => pc.addTrack(t, localStream.current))
          pc.onicecandidate = (e) => e.candidate && send({ type: 'ice', to: from, candidate: e.candidate.toJSON() })
          pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) { pc.close(); peers.current.delete(from) } }
          peers.current.set(from, pc)
          await pc.setLocalDescription(await pc.createOffer())
          send({ type: 'offer', to: from, sdp: pc.localDescription.toJSON() })
        } else if (payload.type === 'answer') {
          await peers.current.get(from)?.setRemoteDescription(payload.sdp).catch(() => {})
        } else if (payload.type === 'ice') {
          await peers.current.get(from)?.addIceCandidate(payload.candidate).catch(() => {})
        }
      })
    } else {
      let attempts = 0
      let retry
      const join = () => {
        viewerPc.current?.close()
        pendingIce.current = []
        const pc = new RTCPeerConnection({ iceServers: live.ICE_SERVERS })
        pc.ontrack = (e) => { if (videoRef.current) { videoRef.current.srcObject = e.streams[0] } }
        pc.onicecandidate = (e) => e.candidate && send({ type: 'ice', to: s.host_id, candidate: e.candidate.toJSON() })
        pc.onconnectionstatechange = () => setConnected(pc.connectionState === 'connected')
        viewerPc.current = pc
        send({ type: 'join', to: s.host_id })
        clearTimeout(retry)
        retry = setTimeout(() => { if (pc.connectionState !== 'connected' && attempts++ < 5 && phaseRef.current === 'watching') join() }, 6000)
      }
      ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (payload.to !== me.id) return
        const pc = viewerPc.current
        if (!pc) return
        if (payload.type === 'offer') {
          await pc.setRemoteDescription(payload.sdp)
          for (const c of pendingIce.current) await pc.addIceCandidate(c).catch(() => {})
          pendingIce.current = []
          await pc.setLocalDescription(await pc.createAnswer())
          send({ type: 'answer', to: s.host_id, sdp: pc.localDescription.toJSON() })
        } else if (payload.type === 'ice') {
          if (pc.remoteDescription) await pc.addIceCandidate(payload.candidate).catch(() => {})
          else pendingIce.current.push(payload.candidate)
        }
      })
      ch.on('broadcast', { event: 'host-ready' }, () => { attempts = 0; join() })
      ch.on('broadcast', { event: 'ended' }, () => { setPhase('ended'); cleanup() })
      ch._vmJoin = join
    }

    ch.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return
      await ch.track({ role, user_id: me.id })
      if (role === 'host') ch.send({ type: 'broadcast', event: 'host-ready', payload: {} })
      else ch._vmJoin?.()
    })
    channelRef.current = ch
  }

  const goLive = async () => {
    setPhase('loading')
    try {
      const s = await live.startStream(me.id, title)
      setStream(s)
      setupChannel(s, 'host')
      setPhase('live')
      window.history.replaceState(null, '', `/live/${s.id}`)
      toast.success('You are live')
    } catch (e) { toast.error(errorMessage(e)); setPhase('preview') }
  }

  const endLive = async () => {
    if (stream) {
      channelRef.current?.send({ type: 'broadcast', event: 'ended', payload: {} })
      await live.endStream(stream.id)
    }
    cleanup()
    toast.success('Live ended')
    navigate('/live')
  }

  // End the stream if the host closes the tab or leaves the page
  useEffect(() => {
    if (phase !== 'live' || !stream) return
    const onHide = () => live.endStream(stream.id)
    window.addEventListener('pagehide', onHide)
    return () => { window.removeEventListener('pagehide', onHide); if (phaseRef.current === 'live') live.endStream(stream.id) }
  }, [phase, stream?.id])

  const toggleTrack = (kind) => {
    const track = localStream.current?.getTracks().find((t) => t.kind === kind)
    if (!track) return
    track.enabled = !track.enabled
    kind === 'audio' ? setMicOn(track.enabled) : setCamOn(track.enabled)
  }

  const react = (emoji) => {
    addFloating(emoji)
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { emoji } })
  }

  const comment = async (e) => {
    e.preventDefault()
    if (!text.trim() || !stream) return
    const v = text; setText('')
    try { await live.sendLiveComment(stream.id, me.id, v) } catch (err) { toast.error(errorMessage(err)); setText(v) }
  }

  const host = stream?.profiles || (phase === 'preview' ? myProfile : null)
  const isHost = phase === 'preview' || phase === 'live'

  if (phase === 'ended') {
    return (
      <div className="grid min-h-[100dvh] place-items-center p-6">
        <div className="glass-card max-w-sm p-8 text-center">
          <Radio size={32} className="mx-auto text-fg/50" />
          <h1 className="mt-4 font-display text-lg font-semibold">This live has ended</h1>
          <p className="mt-1 text-sm text-fg/55">{stream?.profiles?.username ? `@${stream.profiles.username} is no longer streaming.` : 'The stream is no longer available.'}</p>
          <button className="btn-primary mt-5" onClick={() => navigate('/live')}>Browse live streams</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] items-center justify-center md:p-4">
      <div className="relative h-full w-full overflow-hidden bg-black md:max-w-[480px] md:rounded-3xl">
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" style={isHost ? { transform: 'scaleX(-1)' } : undefined} />
        {phase === 'watching' && !connected && (
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-white"><div className="flex flex-col items-center gap-3"><Spinner className="text-white" /><span className="text-sm">Connecting to the stream…</span></div></div>
        )}
        {phase === 'live' && !camOn && <div className="absolute inset-0 grid place-items-center bg-black text-white/70">Camera is off</div>}

        {/* top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent p-4 text-white" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Avatar src={host?.avatar_url} name={fullName(host)} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{host?.username}</p>
            {stream?.title && <p className="truncate text-xs text-white/70">{stream.title}</p>}
          </div>
          {phase !== 'preview' && <span className="ml-2 rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold">LIVE</span>}
          {phase !== 'preview' && <span className="flex items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 text-xs font-bold backdrop-blur"><Eye size={13} />{viewers}</span>}
          <button onClick={phase === 'live' ? endLive : () => { cleanup(); navigate('/live') }} className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur" aria-label="Close"><X size={20} /></button>
        </div>

        {/* floating reactions */}
        <div className="pointer-events-none absolute bottom-28 right-4 h-72 w-24">
          {floating.map((f) => <span key={f.key} className="absolute bottom-0 animate-floatUp text-3xl" style={{ left: `${f.x}%` }}>{f.emoji}</span>)}
        </div>

        {phase === 'preview' ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute inset-x-4 space-y-3 rounded-[1.75rem] border border-white/15 bg-white/10 p-4 backdrop-blur-2xl"
              style={{ bottom: 'calc(max(1.5rem, env(safe-area-inset-bottom)) + 4.5rem)' }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Add a title for your live"
                className="w-full rounded-xl border border-white/20 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/60" />
              <button onClick={goLive} className="btn-primary vm-sheen w-full py-3.5 text-base"><Radio size={19} /> Go live</button>
            </div>
          </>
        ) : phase === 'loading' ? (
          <div className="absolute inset-0 grid place-items-center"><Spinner className="text-white" size={28} /></div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
            <div className="scrollbar-none mb-3 max-h-56 space-y-2 overflow-y-auto pr-16 [mask-image:linear-gradient(to_bottom,transparent,black_25%)]">
              {comments.map((c) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-sm">
                  <Avatar src={c.profiles?.avatar_url} name={c.profiles?.username || ''} size={26} />
                  <p className="drop-shadow"><b className="mr-1.5">{c.profiles?.username}</b>{c.content}</p>
                </motion.div>
              ))}
              <div ref={commentsEnd} />
            </div>
            <div className="flex items-center gap-2">
              <form onSubmit={comment} className="flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-4 pr-1 backdrop-blur">
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Comment…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/60" />
                <button className="grid h-8 w-8 place-items-center rounded-full bg-white/20" aria-label="Send comment"><SendHorizontal size={15} /></button>
              </form>
              {phase === 'live' ? (
                <>
                  <button onClick={() => toggleTrack('audio')} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur" aria-label="Toggle microphone">{micOn ? <Mic size={18} /> : <MicOff size={18} />}</button>
                  <button onClick={() => toggleTrack('video')} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur" aria-label="Toggle camera">{camOn ? <Video size={18} /> : <VideoOff size={18} />}</button>
                </>
              ) : (
                <>
                  {REACTIONS.slice(0, 3).map((r) => <button key={r} onClick={() => react(r)} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-lg backdrop-blur active:scale-90" aria-label={`React ${r}`}>{r}</button>)}
                  {!connected && <button onClick={() => channelRef.current?._vmJoin?.()} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur" aria-label="Reconnect"><RefreshCw size={17} /></button>}
                </>
              )}
            </div>
            {phase === 'live' && <button onClick={endLive} className="btn mt-3 w-full bg-rose-500 text-white hover:bg-rose-600">End live</button>}
          </div>
        )}
      </div>
    </div>
  )
}