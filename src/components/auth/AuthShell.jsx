import { motion } from 'framer-motion'
import Logo from '../common/Logo'
import Backdrop from '../common/Backdrop'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      <Backdrop />
      <div className="relative hidden flex-col justify-between p-12 lg:flex">
        <Logo size={40} />
        <div>
          <h1 className="max-w-lg font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Share the moment.<br />Talk about it right there.
          </h1>
          <p className="mt-5 max-w-md text-base text-fg/60">Short videos, stories, live streams and chats — in one place, synced in real time.</p>
        </div>
        <div className="flex gap-3">
          {['🎬', '💬', '🔴'].map((e, i) => (
            <motion.div key={e} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.08 }}
              className="glass grid h-16 w-16 place-items-center rounded-2xl text-2xl">{e}</motion.div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-5 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="glass-card w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 lg:hidden"><Logo /></div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-fg/60">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-fg/60">{footer}</div>}
        </motion.div>
      </div>
    </div>
  )
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
