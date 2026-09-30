const NOISE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")"

export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="vm-orb-a absolute -left-[12%] -top-[18%] h-[62vmax] w-[62vmax] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle at 40% 40%, #7C3AED, transparent 62%)', opacity: 'var(--orb-a)' }} />
      <div className="vm-orb-b absolute -right-[18%] top-[18%] h-[55vmax] w-[55vmax] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle at 50% 50%, #2563EB, transparent 60%)', opacity: 'calc(var(--orb-a) * .85)' }} />
      <div className="vm-orb-c absolute -bottom-[25%] left-[22%] h-[50vmax] w-[50vmax] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle at 50% 50%, #DB2777, transparent 60%)', opacity: 'calc(var(--orb-a) * .6)' }} />
      {/* fine grid that fades out towards the edges */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgb(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--fg)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 30%, #000 10%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, #000 10%, transparent 70%)',
        }} />
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
    </div>
  )
}