import { Loader2 } from 'lucide-react'
export default function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-fg/60 ${className}`} />
}
export function PageLoader() {
  return <div className="grid min-h-[40vh] place-items-center"><Spinner size={28} /></div>
}
