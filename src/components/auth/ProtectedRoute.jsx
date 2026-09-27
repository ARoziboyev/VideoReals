import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogoMark } from '../common/Logo'

export function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={56} className="animate-pulse" />
        <span className="font-display text-sm tracking-tight text-fg/50">VideoMove</span>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore()
  const location = useLocation()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function PublicOnlyRoute({ children }) {
  const { session, loading } = useAuthStore()
  if (loading) return <Splash />
  if (session) return <Navigate to="/" replace />
  return children
}
