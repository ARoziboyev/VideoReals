import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, X, SendHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import supabase from '../../lib/supabase'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import Caption from './Caption'
import { useAuthStore } from '../../store/authStore'
import * as commentService from '../../services/commentService'
import { cn, errorMessage, formatCount, fullName, timeAgo } from '../../lib/utils'

function CommentItem({ c, liked, onLike, onReply, onDelete, canDelete, isReply }) {
  const author = c.profiles || {}
  return (
    <div className={cn('group flex gap-3 py-2.5', isReply && 'pl-11')}>
      <Link to={`/u/${author.username}`}><Avatar src={author.avatar_url} name={fullName(author)} size={isReply ? 28 : 34} /></Link>
      <div className="min-w-0 flex-1 text-sm">
        <p><Link to={`/u/${author.username}`} className="mr-1.5 font-bold">{author.username}</Link><Caption text={c.content} className="inline" /></p>
        <div className="mt-1 flex items-center gap-4 text-xs font-semibold text-fg/45">
          <span>{timeAgo(c.created_at)}</span>
          {c.likes_count > 0 && <span>{formatCount(c.likes_count)} likes</span>}
          <button onClick={() => onReply(c)} className="hover:text-fg/80">Reply</button>
          {canDelete && <button onClick={() => onDelete(c)} className="opacity-0 transition hover:text-rose-400 group-hover:opacity-100 max-md:opacity-100" aria-label="Delete comment"><Trash2 size={13} /></button>}
        </div>
      </div>
      <button onClick={() => onLike(c)} aria-label="Like comment" className="self-start pt-1 text-fg/50 hover:text-pink-400">
        <Heart size={14} className={cn(liked && 'text-pink-500')} fill={liked ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

export default function CommentsPanel({ post, open, onClose }) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [comments, setComments] = useState([])
  const [liked, setLiked] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    commentService.fetchComments(post.id).then(async (data) => {
      if (!alive) return
      setComments(data)
      setLiked(await commentService.getLikedCommentIds(data.map((c) => c.id), user.id))
    }).catch((e) => toast.error(errorMessage(e))).finally(() => alive && setLoading(false))

    const ch = supabase.channel(`comments-${post.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, async ({ new: c }) => {
        const { data: p } = await supabase.from('profiles').select('id,username,first_name,last_name,avatar_url').eq('id', c.user_id).maybeSingle()
        setComments((list) => (list.some((x) => x.id === c.id) ? list : [...list, { ...c, profiles: p }]))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, ({ new: c }) => {
        setComments((list) => list.map((x) => (x.id === c.id ? { ...x, ...c } : x)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, ({ old }) => {
        setComments((list) => list.filter((x) => x.id !== old.id && x.parent_id !== old.id))
      })
      .subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [open, post.id, user.id])

  const threads = useMemo(() => {
    const top = comments.filter((c) => !c.parent_id)
    return top.map((c) => ({ ...c, replies: comments.filter((r) => r.parent_id === c.id) }))
  }, [comments])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const c = await commentService.addComment({ postId: post.id, userId: user.id, content: text, parentId: replyTo?.parent_id || replyTo?.id || null })
      setComments((list) => (list.some((x) => x.id === c.id) ? list : [...list, c]))
      setText(''); setReplyTo(null)
    } catch (err) { toast.error(errorMessage(err)) }
    finally { setSending(false) }
  }

  const like = async (c) => {
    const has = liked.has(c.id)
    setLiked((s) => { const n = new Set(s); has ? n.delete(c.id) : n.add(c.id); return n })
    setComments((list) => list.map((x) => (x.id === c.id ? { ...x, likes_count: Math.max(0, x.likes_count + (has ? -1 : 1)) } : x)))
    try { await commentService.setCommentLike(c.id, user.id, !has) }
    catch (err) { toast.error(errorMessage(err)) }
  }

  const remove = async (c) => {
    try { await commentService.deleteComment(c.id); setComments((list) => list.filter((x) => x.id !== c.id && x.parent_id !== c.id)); toast.success('Comment deleted') }
    catch (err) { toast.error(errorMessage(err)) }
  }

  const reply = (c) => {
    setReplyTo(c)
    setText(`@${c.profiles?.username} `)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <Modal open={open} onClose={onClose} title={`Comments · ${formatCount(comments.length)}`} size="md" className="sm:h-[80vh]">
      <div className="flex h-full min-h-[50vh] flex-col">
        <div className="flex-1 px-4 py-2">
          {loading ? <div className="grid py-12 place-items-center"><Spinner /></div>
            : threads.length === 0 ? <p className="py-12 text-center text-sm text-fg/50">No comments yet. Start the conversation.</p>
            : threads.map((c) => (
              <div key={c.id}>
                <CommentItem c={c} liked={liked.has(c.id)} onLike={like} onReply={reply} onDelete={remove} canDelete={c.user_id === user.id || post.user_id === user.id} />
                {c.replies.map((r) => (
                  <CommentItem key={r.id} c={r} isReply liked={liked.has(r.id)} onLike={like} onReply={reply} onDelete={remove} canDelete={r.user_id === user.id || post.user_id === user.id} />
                ))}
              </div>
            ))}
        </div>
        <form onSubmit={submit} className="sticky bottom-0 border-t border-line p-3 glass-strong">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-fg/5 px-3 py-1.5 text-xs text-fg/60">
              Replying to @{replyTo.profiles?.username}
              <button type="button" onClick={() => { setReplyTo(null); setText('') }} aria-label="Cancel reply"><X size={14} /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Avatar src={profile?.avatar_url} name={fullName(profile)} size={32} />
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
              placeholder="Add a comment…" className="input flex-1 rounded-full py-2.5" aria-label="Comment" />
            <button disabled={!text.trim() || sending} className="btn-primary h-10 w-10 rounded-full p-0" aria-label="Post comment">
              {sending ? <Spinner size={16} className="text-white" /> : <SendHorizontal size={17} />}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
