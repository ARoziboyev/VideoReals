import { create } from 'zustand'

const KEY = 'vm_theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function apply(theme) {
  const dark = theme === 'dark' || (theme === 'system' && media().matches)
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#070818' : '#EEF0F8')
}

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem(KEY) || 'dark',
  setTheme: (theme) => { localStorage.setItem(KEY, theme); apply(theme); set({ theme }) },
}))

export function initTheme() {
  apply(useThemeStore.getState().theme)
  media().addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') apply('system')
  })
}
