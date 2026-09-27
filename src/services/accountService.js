import supabase from '../lib/supabase'

// Multi-account: each signed-in account keeps its own refresh token in this browser.
// Tokens never leave the device; removing an account revokes its session server-side.
const KEY = 'vm_accounts'

export function getAccounts() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
const saveAll = (list) => localStorage.setItem(KEY, JSON.stringify(list))

export function saveAccount(session, profile) {
  if (!session?.user) return
  const list = getAccounts()
  const prev = list.find((a) => a.id === session.user.id) || {}
  const entry = {
    ...prev,
    id: session.user.id,
    email: session.user.email,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    ...(profile ? { username: profile.username, avatar_url: profile.avatar_url, first_name: profile.first_name } : {}),
  }
  saveAll([entry, ...list.filter((a) => a.id !== entry.id)])
}

export function removeAccount(id) {
  saveAll(getAccounts().filter((a) => a.id !== id))
}

export async function switchAccount(id) {
  const acc = getAccounts().find((a) => a.id === id)
  if (!acc) throw new Error('Account not found')
  const { error } = await supabase.auth.setSession({ access_token: acc.access_token, refresh_token: acc.refresh_token })
  if (error) {
    removeAccount(id)
    throw new Error('This session has expired. Please sign in to that account again.')
  }
}

export async function addAccount(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
  return data
}

// Sign out the current account and move to the next stored one, if any
export async function logoutCurrent(currentId) {
  await supabase.auth.signOut({ scope: 'local' })
  removeAccount(currentId)
  const next = getAccounts()[0]
  if (next) {
    try { await switchAccount(next.id); return true } catch { return false }
  }
  return false
}
