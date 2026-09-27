import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, SearchX } from 'lucide-react'
import VideoCard from '../components/video/VideoCard'
import EmptyState from '../components/common/EmptyState'
import { PageLoader } from '../components/common/Spinner'
import { useAuthStore } from '../store/authStore'
import * as videoService from '../services/videoService'

export default function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [post, setPost] = useState(undefined)
  const [inter, setInter] = useState({ liked: new Set(), saved: new Set() })

  useEffect(() => {
    setPost(undefined)
    videoService.fetchPost(id).then(async (p) => {
      setPost(p)
      if (p) setInter(await videoService.getInteractions([p.id], user.id))
    }).catch(() => setPost(null))
  }, [id, user.id])

  return (
    <div className="mx-auto max-w-[560px] px-3 py-4">
      <button className="icon-btn mb-2" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={21} /></button>
      {post === undefined ? <PageLoader />
        : post === null ? <EmptyState icon={SearchX} title="Post not found" text="It may have been deleted." />
        : <VideoCard post={post} liked={inter.liked.has(post.id)} saved={inter.saved.has(post.id)} onDeleted={() => navigate('/')} />}
    </div>
  )
}
