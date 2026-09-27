export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl glass"><Icon size={24} className="text-fg/70" /></div>}
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {text && <p className="mt-1.5 max-w-xs text-sm text-fg/55">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
