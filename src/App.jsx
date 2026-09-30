import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import supabase, { isSupabaseConfigured } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { saveAccount } from './services/accountService'
import { applyPendingAvatar } from './services/profileService'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute, { PublicOnlyRoute } from './components/auth/ProtectedRoute'
import SetupNotice from './components/common/SetupNotice'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Home from './pages/Home'
import Reels from './pages/Reels'
import Explore from './pages/Explore'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import PostPage from './pages/PostPage'
import Live from './pages/Live'
import LiveRoom from './pages/LiveRoom'
import Settings from './pages/Settings'
import Music from './pages/Music'

export default function App() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    const afterSignIn = async () => {
      const store = useAuthStore.getState()
      const profile = await store.loadProfile()
      if (store.session) saveAccount(store.session, profile)
      const updated = await applyPendingAvatar(store.user)
      if (updated) store.setProfile(updated)
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await afterSignIn()
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session) saveAccount(session, useAuthStore.getState().profile?.id === session.user.id ? useAuthStore.getState().profile : null)
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password')
      if (session && ['SIGNED_IN', 'USER_UPDATED'].includes(event)) setTimeout(afterSignIn, 0)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) return <SetupNotice />

  return (
    <>
      <Toaster position="top-center" toastOptions={{ className: 'vm-toast', duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="reels" element={<Reels />} />
          <Route path="explore" element={<Explore />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="u/:username" element={<Profile />} />
          <Route path="p/:id" element={<PostPage />} />
          <Route path="live" element={<Live />} />
          <Route path="live/:id" element={<LiveRoom />} />
          <Route path="music" element={<Music />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/:section" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}