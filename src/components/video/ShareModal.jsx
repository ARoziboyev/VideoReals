import { useEffect, useState } from 'react'
import { Link2, Download, Share2, Send, Check, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import { conversationMeta } from '../chat/ConversationList'
import { useAuthStore } from '../../store/authStore'
import { fetchConversations, sendMessage } from '../../services/messageService'
import { downloadPost } from '../../services/videoService'
import { useT } from '../../lib/i18n'
import { errorMessage } from '../../lib/utils'

export default function ShareModal({ post, open, onClose }) {
  const t = useT()
  const me = useAuthStore((s) => s.user)
  const [convs, setConvs] = useState(null)
  const [sent, setSent] = useState(new Set())
  const [busy, setBusy] = useState(null)
  const link = `${window.location.origin}/p/${post.id}`

  useEffect(() => {
    if (!open) return
    setSent(new Set())
    fetchConversations().then(setConvs).catch(() => setConvs([]))
  }, [open])

  const copy = async () => { await navigator.clipboard.writeText(link); toast.success('Link copied') }
  const native = async () => {
    try { await navigator.share({ title: 'VideoMove', text: post.caption || '', url: link }) }
    catch (e) { if (e?.name !== 'AbortError') toast.error('Sharing is not available here') }
  }
  const download = () => { try { downloadPost(post); toast.success('Download started') } catch { toast.error('Download failed') } }
  const sendTo = async (c) => {
    setBusy(c.id)
    try {
      const { other } = conversationMeta(c, me.id)
      await sendMessage({ conversationId: c.id, senderId: me.id, receiverId: other?.id || null, content: `${post.caption ? post.caption.slice(0, 120) + '\n' : ''}${link}` })
      setSent((s) => new Set(s).add(c.id))
    } catch (e) { toast.error(errorMessage(e)) }
    finally { setBusy(null) }
  }

  const actions = [
    [Link2, t('copyLink'), copy, '#8B5CF6'],
    [Download, t('download'), download, '#22C55E'],
    ...(navigator.share ? [[Share2, t('share'), native, '#4F7CFF']] : []),
  ]

  return (
    <Modal open={open} onClose={onClose} title={t('share')} size="sm">
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {actions.map(([Icon, label, fn, color]) => (
            <button key={label} onClick={fn} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-fg/[0.03] p-3 text-xs font-semibold transition hover:bg-fg/[0.08]">
              <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: `${color}26`, color, boxShadow: `0 0 22px -8px ${color}` }}><Icon size={19} /></span>
              {label}
            </button>
          ))}
        </div>
        <p className="label mt-5 px-1">{t('sendTo')}</p>
        <div className="thin-scroll max-h-[40vh] overflow-y-auto">
          {!convs ? <div className="grid py-8 place-items-center"><Spinner /></div>
            : convs.length === 0 ? <p className="py-6 text-center text-sm text-fg/50">No chats yet</p>
            : convs.map((c) => {
              const { title, avatar } = conversationMeta(c, me.id)
              const done = sent.has(c.id)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-fg/5">
                  {c.is_group && !avatar ? <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white"><Users size={17} /></span>
                    : <Avatar src={avatar} name={title} size={40} />}
                  <span className="flex-1 truncate text-sm font-semibold">{title}</span>
                  <button disabled={done || busy === c.id} onClick={() => sendTo(c)} className={done ? 'btn-ghost py-1.5 text-xs' : 'btn-primary py-1.5 text-xs'}>
                    {busy === c.id ? <Spinner size={14} className="text-white" /> : done ? <><Check size={14} />Sent</> : <><Send size={13} />{t('sendTo')}</>}
                  </button>
                </div>
              )
            })}
        </div>
      </div>
    </Modal>
  )
}