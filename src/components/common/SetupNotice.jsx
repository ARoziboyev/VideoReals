import Logo from './Logo'
import Backdrop from './Backdrop'

export default function SetupNotice() {
  return (
    <div className="grid min-h-[100dvh] place-items-center p-6">
      <Backdrop />
      <div className="glass-card max-w-md p-8">
        <Logo />
        <h1 className="mt-6 font-display text-lg font-semibold">Connect Supabase to start</h1>
        <p className="mt-2 text-sm text-fg/65">Create a <code className="rounded bg-fg/10 px-1">.env</code> file in the project root with your project URL and anon key, then restart <code className="rounded bg-fg/10 px-1">npm run dev</code>.</p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-fg/5 p-4 text-xs">VITE_SUPABASE_URL=https://xxxx.supabase.co{'\n'}VITE_SUPABASE_ANON_KEY=eyJ...</pre>
        <p className="mt-4 text-sm text-fg/65">Then run <code className="rounded bg-fg/10 px-1">supabase/schema.sql</code> in the Supabase SQL Editor.</p>
      </div>
    </div>
  )
}
