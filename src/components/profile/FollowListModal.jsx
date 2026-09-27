import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import UserRow from '../common/UserRow'
import FollowButton from '../common/FollowButton'
import { useAuthStore } from '../../store/authStore'
import { getFollowers, getFollowing, getFollowingSet } from '../../services/followService'
import { errorMessage } from '../../lib/utils'

export default function FollowListModal({ userId, type, onClose }) {
  const me = useAuthStore((s) => s.user)
  const [users, setUsers] = useState(null)
  const [following, setFollowing] = useState(new Set())

  useEffect(() => {
    if (!type) return
    setUsers(null)
    ;(type === 'followers' ? getFollowers(userId) : getFollowing(userId))
      .then(async (list) => { setFollowing(await getFollowingSet(me.id, list.map((u) => u.id))); setUsers(list) })
      .catch((e) => toast.error(errorMessage(e)))
  }, [type, userId, me.id])

  return (
    <Modal open={Boolean(type)} onClose={onClose} title={type === 'followers' ? 'Followers' : 'Following'} size="sm">
      <div className="p-2">
        {!users ? <div className="grid py-10 place-items-center"><Spinner /></div>
          : users.length === 0 ? <p className="py-10 text-center text-sm text-fg/50">Nobody here yet</p>
          : users.map((u) => (
            <div key={u.id} onClick={onClose}>
              <UserRow user={u} right={<FollowButton userId={u.id} initial={following.has(u.id)} compact />} />
            </div>
          ))}
      </div>
    </Modal>
  )
}
