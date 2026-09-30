import supabase from '../lib/supabase'
import { useCallStore } from '../store/callStore'
import { useAuthStore } from '../store/authStore'
import { ICE_SERVERS } from './liveService'
import { sendMessage } from './messageService'
import { startTone, stopTone } from '../lib/tones'

// Signaling: invite goes to the callee's personal channel `calls:<userId>`,
// everything else (accept, SDP, ICE, hangup) runs on `call-session:<callId>`.
let pc = null
let session = null
let peerChannel = null
let listener = null
let inviteTimer = null
let timeoutTimer = null
let iceQueue = []
const seenCalls = new Set()

const S = () => useCallStore.getState()
const me = () => useAuthStore.getState().profile

const publicProfile = (p) => ({ id: p.id, username: p.username, first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url })

function getMedia(kind, facing = 'user') {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: kind === 'video' ? { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  })
}

function send(event, payload = {}) {
  session?.send({ type: 'broadcast', event, payload: { ...payload, from: me()?.id } })
}

function createPeer() {
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
  const local = S().localStream
  local?.getTracks().forEach((t) => pc.addTrack(t, local))
  pc.onicecandidate = (e) => e.candidate && send('ice', { candidate: e.candidate.toJSON() })
  pc.ontrack = (e) => S().set({ remoteStream: e.streams[0] })
  pc.onconnectionstatechange = () => {
    const state = pc?.connectionState
    if (state === 'connected' && S().status !== 'active') { stopTone(); S().set({ status: 'active', startedAt: Date.now() }) }
    if (state === 'failed') finish('failed')
  }
}

async function flushIce() {
  for (const c of iceQueue) await pc?.addIceCandidate(c).catch(() => {})
  iceQueue = []
}

function joinSession(callId) {
  return new Promise((resolve) => {
    session = supabase.channel(`call-session:${callId}`, { config: { broadcast: { self: false } } })
    session
      .on('broadcast', { event: 'accept' }, async () => {
        if (!S().isCaller || S().status !== 'outgoing') return
        clearInterval(inviteTimer); clearTimeout(timeoutTimer); stopTone()
        S().set({ status: 'connecting' })
        createPeer()
        await pc.setLocalDescription(await pc.createOffer())
        send('offer', { sdp: pc.localDescription.toJSON() })
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (S().isCaller || !pc) return
        await pc.setRemoteDescription(payload.sdp)
        await flushIce()
        await pc.setLocalDescription(await pc.createAnswer())
        send('answer', { sdp: pc.localDescription.toJSON() })
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (!pc) return
        await pc.setRemoteDescription(payload.sdp)
        await flushIce()
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (pc?.remoteDescription) await pc.addIceCandidate(payload.candidate).catch(() => {})
        else iceQueue.push(payload.candidate)
      })
      .on('broadcast', { event: 'decline' }, () => finish('declined'))
      .on('broadcast', { event: 'busy' }, () => finish('busy'))
      .on('broadcast', { event: 'cancel' }, () => finish('missed'))
      .on('broadcast', { event: 'hangup' }, () => finish(S().startedAt ? 'completed' : 'missed'))
      .subscribe((status) => { if (status === 'SUBSCRIBED') resolve() })
  })
}

function cleanup() {
  clearInterval(inviteTimer); clearTimeout(timeoutTimer); stopTone()
  pc?.close(); pc = null
  S().localStream?.getTracks().forEach((t) => t.stop())
  if (session) { supabase.removeChannel(session); session = null }
  if (peerChannel) { supabase.removeChannel(peerChannel); peerChannel = null }
  iceQueue = []
}

function finish(reason) {
  const st = S()
  if (st.status === 'idle' || st.status === 'ended') return
  const duration = st.startedAt ? Math.round((Date.now() - st.startedAt) / 1000) : 0
  // Only the caller writes the call log, so it appears once in the chat
  if (st.isCaller && st.conversationId && me()) {
    const status = st.startedAt ? 'completed' : reason === 'declined' ? 'declined' : 'missed'
    sendMessage({
      conversationId: st.conversationId, senderId: me().id, receiverId: st.peer?.id,
      type: 'call', meta: { kind: st.kind, status, duration },
    }).catch(() => {})
  }
  cleanup()
  S().set({ status: 'ended', endReason: reason, localStream: null, remoteStream: null })
  setTimeout(() => { if (S().status === 'ended') S().reset() }, 1600)
}

export function initCallListener(userId) {
  if (listener) supabase.removeChannel(listener)
  listener = supabase.channel(`calls:${userId}`)
    .on('broadcast', { event: 'invite' }, async ({ payload }) => {
      if (seenCalls.has(payload.callId)) return
      seenCalls.add(payload.callId)
      if (S().status !== 'idle') {
        const busy = supabase.channel(`call-session:${payload.callId}`, { config: { broadcast: { self: false } } })
        busy.subscribe((s) => {
          if (s !== 'SUBSCRIBED') return
          busy.send({ type: 'broadcast', event: 'busy', payload: {} })
          setTimeout(() => supabase.removeChannel(busy), 1500)
        })
        return
      }
      S().set({
        status: 'incoming', kind: payload.kind, peer: payload.from, callId: payload.callId,
        conversationId: payload.conversationId, isCaller: false, muted: false, cameraOff: false, startedAt: null, endReason: null,
      })
      await joinSession(payload.callId)
      startTone('ring')
      timeoutTimer = setTimeout(() => { if (S().status === 'incoming') finish('missed') }, 45000)
    })
    .subscribe()
  return () => { if (listener) supabase.removeChannel(listener); listener = null }
}

export async function startCall({ peer, kind, conversationId }) {
  if (S().status !== 'idle') throw new Error('You are already in a call')
  const callId = crypto.randomUUID()
  seenCalls.add(callId)
  S().set({ status: 'outgoing', kind, peer, callId, conversationId, isCaller: true, muted: false, cameraOff: false, startedAt: null, endReason: null, facing: 'user' })
  let stream
  try { stream = await getMedia(kind) }
  catch {
    S().reset()
    throw new Error(kind === 'video' ? 'Camera or microphone access was denied' : 'Microphone access was denied')
  }
  if (S().callId !== callId) { stream.getTracks().forEach((t) => t.stop()); return }
  S().set({ localStream: stream })
  await joinSession(callId)
  peerChannel = supabase.channel(`calls:${peer.id}`)
  await new Promise((resolve) => peerChannel.subscribe((s) => s === 'SUBSCRIBED' && resolve()))
  if (S().callId !== callId) return
  const invite = () => peerChannel?.send({
    type: 'broadcast', event: 'invite',
    payload: { callId, kind, conversationId, from: publicProfile(me()) },
  })
  invite()
  inviteTimer = setInterval(invite, 3000)
  startTone('ringback')
  timeoutTimer = setTimeout(() => { send('cancel'); finish('missed') }, 40000)
}

export async function acceptCall() {
  const st = S()
  if (st.status !== 'incoming') return
  stopTone(); clearTimeout(timeoutTimer)
  try {
    const stream = await getMedia(st.kind)
    S().set({ localStream: stream, status: 'connecting' })
  } catch {
    send('decline'); finish('declined')
    throw new Error('Camera or microphone access was denied')
  }
  createPeer()
  send('accept')
}

export function declineCall() {
  send('decline')
  finish('declined')
}

export function hangUp() {
  const st = S().status
  if (st === 'incoming') return declineCall()
  if (st === 'outgoing') { send('cancel'); return finish('missed') }
  send('hangup')
  finish('completed')
}

export function toggleMute() {
  const { localStream, muted } = S()
  localStream?.getAudioTracks().forEach((t) => { t.enabled = muted })
  S().set({ muted: !muted })
}

export function toggleCamera() {
  const { localStream, cameraOff } = S()
  localStream?.getVideoTracks().forEach((t) => { t.enabled = cameraOff })
  S().set({ cameraOff: !cameraOff })
}

export async function switchCamera() {
  const { localStream, facing, kind } = S()
  if (kind !== 'video' || !localStream) return
  const nextFacing = facing === 'user' ? 'environment' : 'user'
  const fresh = await navigator.mediaDevices.getUserMedia({ video: { facingMode: nextFacing } })
  const newTrack = fresh.getVideoTracks()[0]
  const sender = pc?.getSenders().find((s) => s.track?.kind === 'video')
  await sender?.replaceTrack(newTrack)
  localStream.getVideoTracks().forEach((t) => { t.stop(); localStream.removeTrack(t) })
  localStream.addTrack(newTrack)
  S().set({ facing: nextFacing, localStream: new MediaStream(localStream.getTracks()) })
}