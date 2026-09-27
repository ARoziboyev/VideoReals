import toast from 'react-hot-toast'

export async function shareUrl(path, text = '') {
  const url = `${window.location.origin}${path}`
  try {
    if (navigator.share) { await navigator.share({ title: 'VideoMove', text, url }); return }
    await navigator.clipboard.writeText(url)
    toast.success('Link copied')
  } catch (e) {
    if (e?.name !== 'AbortError') toast.error('Could not share the link')
  }
}
