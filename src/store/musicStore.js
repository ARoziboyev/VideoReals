import { create } from 'zustand'

export const useMusicStore = create((set) => ({
  queue: [],
  index: -1,
  playing: false,
  playTrack: (track, queue) => {
    const q = queue?.length ? queue : [track]
    const i = q.findIndex((t) => t.id === track.id)
    set({ queue: q, index: i < 0 ? 0 : i, playing: true })
  },
  toggle: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (playing) => set({ playing }),
  next: () => set((s) => (s.index < s.queue.length - 1 ? { index: s.index + 1, playing: true } : { playing: false })),
  prev: () => set((s) => ({ index: Math.max(0, s.index - 1), playing: true })),
  close: () => set({ queue: [], index: -1, playing: false }),
}))

export const useCurrentTrack = () => useMusicStore((s) => s.queue[s.index] || null)