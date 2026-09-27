export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full blur-[120px]" style={{ background: '#6D3BF5', opacity: 'var(--orb-a)' }} />
      <div className="absolute -right-48 top-1/3 h-[30rem] w-[30rem] rounded-full blur-[130px]" style={{ background: '#2E5BFF', opacity: 'calc(var(--orb-a) * .8)' }} />
      <div className="absolute -bottom-48 left-1/3 h-[28rem] w-[28rem] rounded-full blur-[140px]" style={{ background: '#E0338F', opacity: 'calc(var(--orb-a) * .55)' }} />
    </div>
  )
}
