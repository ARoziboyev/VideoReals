import { useEffect, useRef, useState } from 'react'
import { Search, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../common/Spinner'
import { validateFile } from '../../services/storageService'

const KEY = import.meta.env.VITE_GIPHY_KEY

// GIPHY search when VITE_GIPHY_KEY is set; uploading your own GIF always works
export default function GifPicker({ onPickUrl, onPickFile }) {
  const [q, setQ] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!KEY) return
    let alive = true
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const endpoint = q.trim() ? 'search' : 'trending'
        const res = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?api_key=${KEY}&limit=24&rating=pg-13${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`)
        const json = await res.json()
        if (alive) setGifs(json.data || [])
      } catch { if (alive) setGifs([]) }
      finally { alive && setLoading(false) }
    }, 300)
    return () => { alive = false; clearTimeout(timer) }
  }, [q])

  const pickFile = (f) => {
    if (!f) return
    try { validateFile(f, 'images') } catch (e) { toast.error(e.message); return }
    onPickFile(f)
  }

  return (
    <div className="space-y-2">
      {KEY && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search GIPHY" className="input py-2 pl-9" />
        </div>
      )}
      {KEY && (
        <div className="thin-scroll grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto">
          {loading ? <div className="col-span-3 grid py-6 place-items-center"><Spinner /></div>
            : gifs.map((g) => (
              <button key={g.id} type="button" onClick={() => onPickUrl(g.images.fixed_height.url)} className="overflow-hidden rounded-lg bg-fg/5">
                <img src={g.images.fixed_height_small.url} alt={g.title} loading="lazy" className="h-24 w-full object-cover" />
              </button>
            ))}
        </div>
      )}
      <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost w-full"><Upload size={15} />Upload GIF or image</button>
      <input ref={fileRef} type="file" hidden accept="image/gif,image/*" onChange={(e) => { pickFile(e.target.files[0]); e.target.value = '' }} />
      {KEY && <p className="text-center text-[10px] uppercase tracking-widest text-fg/35">Powered by GIPHY</p>}
    </div>
  )
}
