export const cn = (...c) => c.filter(Boolean).join(' ')

export function timeAgo(date) {
  if (!date) return ''
  const s = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000))
  if (s < 45) return 'now'
  const m = Math.floor(s / 60); if (m < 60) return `${Math.max(m, 1)}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`
  const w = Math.floor(d / 7); if (w < 52) return `${w}w`
  return `${Math.floor(d / 365)}y`
}

export function clockTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatCount(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function formatDuration(sec = 0) {
  const s = Math.max(0, Math.round(sec || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function formatBytes(b = 0) {
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(1)} GB`
}

export const fullName = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.username || ''

export function parseHashtags(text = '') {
  return [...new Set((text.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.slice(1).toLowerCase()))]
}

export function sanitizeSearch(q = '') {
  return q.replace(/[%,()*\\]/g, ' ').trim()
}

export function lastSeenText(profile, online) {
  if (online) return 'Online'
  if (profile?.settings?.privacy?.show_online_status === false) return 'Last seen recently'
  if (!profile?.last_seen) return 'Offline'
  const ago = timeAgo(profile.last_seen)
  return ago === 'now' ? 'Last seen just now' : `Last seen ${ago} ago`
}

export function errorMessage(e) {
  if (!e) return 'Something went wrong'
  if (e.code === '23505') return 'This value is already taken'
  return e.message || String(e)
}
