import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { fetchConversations, forwardMessage } from '../../services/messageService'
import { conversationMeta } from './ConversationList'
import { errorMessage } from '../../lib/utils'

export default function ForwardModal({ message, onClose }) {
  const me = useAuthStore((s) => s.user)
  const [convs, setConvs] = useState(null)
  const [busy, setBusy] = useState(null)

  useEffect(() => { if (message) fetchConversations().then(setConvs).catch((e) => toast.error(errorMessage(e))) }, [message])

  const send = async (c) => {
    setBusy(c.id)
    try { await forwardMessage(message, c.id, me.id); toast.success('Message forwarded'); onClose() }
    catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(null) }
  }

  return (
    <Modal open={Boolean(message)} onClose={onClose} title="Forward to" size="sm">
      <div className="p-2">
        {!convs ? <div className="grid py-10 place-items-center"><Spinner /></div> : convs.map((c) => {
          const { title, avatar } = conversationMeta(c, me.id)
          return (
            <button key={c.id} disabled={Boolean(busy)} onClick={() => send(c)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-fg/5">
              <Avatar src={avatar} name={title} size={40} />
              <span className="flex-1 truncate text-sm font-semibold">{title}</span>
              {busy === c.id && <Spinner size={16} />}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
