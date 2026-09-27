import supabase from '../lib/supabase'
import { fileToDataUrl } from './storageService'

const PENDING_AVATAR = 'vm_pending_avatar'

export async function isUsernameTaken(username) {
  const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
  return Boolean(data)
}

export async function register({ firstName, lastName, username, email, password, avatar }) {
  const uname = username.trim().toLowerCase()
  if (!/^[a-z0-9_.]{3,30}$/.test(uname)) throw new Error('Username: 3–30 characters, letters, numbers, _ and . only')
  if (await isUsernameTaken(uname)) throw new Error('This username is already taken')
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { username: uname, first_name: firstName.trim(), last_name: lastName.trim() },
    },
  })
  if (error) throw error
  if (avatar) {
    // Avatar is uploaded after the first sign-in (the session may not exist until the email is verified)
    localStorage.setItem(PENDING_AVATAR, JSON.stringify({ email: email.trim().toLowerCase(), dataUrl: await fileToDataUrl(avatar) }))
  }
  return data
}

export function getPendingAvatar(email) {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_AVATAR) || 'null')
    return p && p.email === email?.toLowerCase() ? p : null
  } catch { return null }
}
export const clearPendingAvatar = () => localStorage.removeItem(PENDING_AVATAR)

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  return data
}

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } })
  if (error) throw error
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
  if (error) throw error
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function updateEmail(email) {
  const { error } = await supabase.auth.updateUser({ email: email.trim() })
  if (error) throw error
}

export async function resendVerification(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
  if (error) throw error
}

export async function logout(scope = 'local') {
  const { error } = await supabase.auth.signOut({ scope })
  if (error) throw error
}
