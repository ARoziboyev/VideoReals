import { useEffect, useState } from 'react'
import { getSignedUrl } from '../services/storageService'

export function useSignedUrl(bucket, path) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    let alive = true
    setUrl(null); setError(null)
    if (!path) return
    getSignedUrl(bucket, path).then((u) => alive && setUrl(u)).catch((e) => alive && setError(e))
    return () => { alive = false }
  }, [bucket, path])
  return { url, error }
}
