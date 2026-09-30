import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import UserRow from '../common/UserRow'
import FollowButton from '../common/FollowButton'
import { useAuthStore } from '../../store/authStore'
import { fetchLikers } from '../../services/videoService'
import { getFollowingSet } from '../../services/followService'
import { useT } from '../../lib/i18n'
import { errorMessage } from '../../lib/utils'

export default function LikesModal({ postId, open, onClose }) {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const [users, setUsers] = useState(null)
  const [following, setFollowing] = useState(new Set())

  useEffect(() => {
    if (!open) return
    setUsers(null)
    fetchLikers(postId).then(async (list) => {
      setFollowing(await getFollowingSet(me.id, list.map((u) => u.id)))
      setUsers(list)
    }).catch((e) => { toast.error(errorMessage(e)); setUsers([]) })
  }, [open, postId, me.id])

  return (
    <Modal open={open} onClose={onClose} title={t('likes')} size="sm">
      <div className="p-2">
        {!users ? <div className="grid py-10 place-items-center"><Spinner /></div>
          : users.length === 0 ? <p className="flex flex-col items-center gap-2 py-10 text-sm text-fg/50"><Heart size={26} />No likes yet</p>
          : users.map((u) => (
            <div key={u.id} onClick={(e) => e.target.closest('a') && onClose()}>
              <UserRow user={u} right={<FollowButton userId={u.id} initial={following.has(u.id)} compact />} />
            </div>
          ))}
      </div>
    </Modal>
  )
}