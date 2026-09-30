import { create } from 'zustand'

const initial = {
  status: 'idle', // idle | outgoing | incoming | connecting | active | ended
  kind: 'video', // video | audio
  peer: null,
  callId: null,
  conversationId: null,
  isCaller: false,
  localStream: null,
  remoteStream: null,
  muted: false,
  cameraOff: false,
  facing: 'user',
  startedAt: null,
  endReason: null,
}

export const useCallStore = create((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set({ ...initial }),
}))