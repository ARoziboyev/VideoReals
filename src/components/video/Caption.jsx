import { Link } from 'react-router-dom'

export default function Caption({ text = '', className = '' }) {
  if (!text) return null
  const parts = text.split(/([#@][\p{L}\p{N}_.]+)/gu)
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((p, i) => {
        if (p.startsWith('#') && p.length > 1) return <Link key={i} to={`/explore?tag=${encodeURIComponent(p.slice(1).toLowerCase())}`} className="font-semibold text-sky-400 hover:underline">{p}</Link>
        if (p.startsWith('@') && p.length > 1) return <Link key={i} to={`/u/${p.slice(1).toLowerCase().replace(/\.$/, '')}`} className="font-semibold text-violet-400 hover:underline">{p}</Link>
        return <span key={i}>{p}</span>
      })}
    </p>
  )
}
