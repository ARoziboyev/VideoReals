import { create } from 'zustand'
import supabase from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setLoading: (loading) => set({ loading }),
  setSession: (session) => set({ session, user: session?.user ?? null, ...(session ? {} : { profile: null }) }),
  setProfile: (profile) => set({ profile }),
  loadProfile: async () => {
    const user = get().user
    if (!user) { set({ profile: null }); return null }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (!error) set({ profile: data })
    return data
  },
}))
