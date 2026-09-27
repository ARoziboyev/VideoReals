import { create } from 'zustand'

export const useUIStore = create((set) => ({
  lang: localStorage.getItem('vm_lang') || 'uz',
  setLang: (lang) => { localStorage.setItem('vm_lang', lang); document.documentElement.lang = lang; set({ lang }) },

  createOpen: false,
  setCreateOpen: (createOpen) => set({ createOpen }),
  uploadType: null, // 'video' | 'image' | null
  setUploadType: (uploadType) => set({ uploadType, createOpen: false }),
  storyOpen: false,
  setStoryOpen: (storyOpen) => set({ storyOpen, createOpen: false }),

  onlineUsers: new Set(),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

  unreadNotifications: 0,
  unreadMessages: 0,
  setUnread: (v) => set(v),
  incNotifications: () => set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
  incMessages: () => set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
}))
