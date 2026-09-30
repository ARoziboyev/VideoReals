import { motion } from 'framer-motion'
import Logo from '../common/Logo'
import Backdrop from '../common/Backdrop'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      <Backdrop />
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Logo size={40} />
        <div className="relative mx-auto h-[26rem] w-full max-w-lg">
          {/* reel card */}
          <motion.div initial={{ opacity: 0, y: 30, rotate: -10 }} animate={{ opacity: 1, y: 0, rotate: -7 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card absolute left-4 top-6 h-[22rem] w-52 overflow-hidden p-2">
            <div className="relative h-full w-full overflow-hidden rounded-[1.3rem]"
              style={{ background: 'radial-gradient(90% 70% at 30% 20%, #8B5CF6, transparent 60%), radial-gradient(80% 60% at 80% 90%, #EC4899, transparent 60%), #111133' }}>
              <div className="absolute bottom-3 left-3 right-12 space-y-1.5">
                <div className="flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-white/80" /><span className="h-2 w-16 rounded-full bg-white/70" /></div>
                <span className="block h-2 w-28 rounded-full bg-white/40" />
              </div>
              <div className="absolute bottom-3 right-2 flex flex-col gap-2">
                {[0, 1, 2].map((i) => <span key={i} className="h-7 w-7 rounded-full border border-white/25 bg-white/15 backdrop-blur" />)}
              </div>
            </div>
          </motion.div>
          {/* chat card */}
          <motion.div initial={{ opacity: 0, y: 40, rotate: 8 }} animate={{ opacity: 1, y: 0, rotate: 5 }} transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card absolute right-2 top-20 w-64 space-y-2.5 p-4">
            <div className="flex items-center gap-2.5 border-b border-line pb-3">
              <span className="h-8 w-8 rounded-full" style={{ background: 'linear-gradient(135deg,#4F7CFF,#EC4899)' }} />
              <div className="space-y-1"><span className="block h-2 w-20 rounded-full bg-fg/60" /><span className="block h-1.5 w-12 rounded-full bg-emerald-400/70" /></div>
            </div>
            <div className="w-40 rounded-2xl rounded-bl-md bg-fg/10 px-3 py-2 text-xs text-fg/80">did you see the new reel? 🔥</div>
            <div className="ml-auto w-36 rounded-2xl rounded-br-md px-3 py-2 text-xs text-white" style={{ background: 'linear-gradient(135deg,#7C4DFF,#4F7CFF)' }}>calling you in 5 min</div>
            <div className="flex w-32 items-center gap-2 rounded-2xl bg-fg/10 px-3 py-2">
              <span className="vm-eq flex h-3 items-end gap-[2px] text-violet-300"><span style={{ height: '100%' }} /><span style={{ height: '100%' }} /><span style={{ height: '100%' }} /></span>
              <span className="h-1 flex-1 rounded-full bg-fg/25" />
            </div>
          </motion.div>
          {/* live pill */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: 'spring', damping: 16 }}
            className="absolute bottom-6 left-40 flex items-center gap-2 rounded-full px-4 py-2 glass-strong">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /><span className="text-xs font-bold">LIVE</span><span className="text-xs text-fg/55">2.4K watching</span>
          </motion.div>
        </div>
        <div>
          <h1 className="max-w-lg font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
            Share the moment.<br /><span className="text-gradient">Talk about it right there.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-fg/60">Short videos, stories, live streams, calls and chats — synced in real time.</p>
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