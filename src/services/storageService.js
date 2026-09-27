import supabase from '../lib/supabase'
import { formatBytes } from '../lib/utils'

const MB = 1024 * 1024

export const BUCKET_RULES = {
  avatars: { max: 5 * MB, types: ['image/'] },
  videos: { max: 50 * MB, types: ['video/'] },
  images: { max: 15 * MB, types: ['image/'] },
  thumbnails: { max: 5 * MB, types: ['image/'] },
  stories: { max: 50 * MB, types: ['image/', 'video/'] },
  'chat-media': { max: 50 * MB, types: null },
  'voice-messages': { max: 10 * MB, types: ['audio/'] },
}
export const PUBLIC_BUCKETS = ['avatars', 'videos', 'images', 'thumbnails', 'stories']

const EXT = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' }

export function validateFile(file, bucket) {
  const rule = BUCKET_RULES[bucket]
  if (!file) throw new Error('Choose a file first')
  if (file.size === 0) throw new Error('This file is empty')
  if (file.size > rule.max) throw new Error(`File is too large. Maximum size is ${formatBytes(rule.max)}`)
  const type = (file.type || '').split(';')[0]
  if (rule.types && !rule.types.some((t) => type.startsWith(t))) {
    throw new Error(`Unsupported file type${type ? ` (${type})` : ''}`)
  }
}

export async function uploadFile(bucket, file, folder) {
  validateFile(file, bucket)
  const contentType = (file.type || 'application/octet-stream').split(';')[0]
  const fromName = file.name?.includes('.') ? file.name.split('.').pop() : null
  const ext = (fromName || EXT[contentType] || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType, upsert: false, cacheControl: '3600' })
  if (error) throw new Error(error.message || 'Upload failed')
  if (PUBLIC_BUCKETS.includes(bucket)) return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  return path
}

export function pathFromPublicUrl(url, bucket) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

export async function removeByUrl(url, bucket) {
  const path = pathFromPublicUrl(url, bucket)
  if (path) await supabase.storage.from(bucket).remove([path])
}

const signedCache = new Map()
export async function getSignedUrl(bucket, path) {
  const key = `${bucket}/${path}`
  const hit = signedCache.get(key)
  if (hit && hit.exp > Date.now()) return hit.url
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  if (error) throw error
  signedCache.set(key, { url: data.signedUrl, exp: Date.now() + 55 * 60 * 1000 })
  return data.signedUrl
}

export function dataUrlToFile(dataUrl, name = 'file') {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)[1]
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], name, { type: mime })
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export function captureVideoThumbnail(file) {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    const url = URL.createObjectURL(file)
    v.preload = 'metadata'; v.muted = true; v.playsInline = true; v.src = url
    const done = (f) => { URL.revokeObjectURL(url); resolve(f) }
    v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2) }
    v.onseeked = () => {
      const c = document.createElement('canvas')
      const scale = Math.min(1, 720 / (v.videoWidth || 720))
      c.width = (v.videoWidth || 720) * scale; c.height = (v.videoHeight || 1280) * scale
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
      c.toBlob((b) => done(b ? new File([b], 'thumbnail.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', 0.82)
    }
    v.onerror = () => done(null)
  })
}
