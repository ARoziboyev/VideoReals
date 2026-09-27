import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import { useAuthStore } from '../../store/authStore'
import { updateProfile, uploadAvatar } from '../../services/profileService'
import { validateFile } from '../../services/storageService'
import { saveAccount } from '../../services/accountService'
import { errorMessage, fullName } from '../../lib/utils'
import { useT } from '../../lib/i18n'

export default function EditProfileModal({ open, onClose, onSaved }) {
  const t = useT()
  const { profile, setProfile, session } = useAuthStore()
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', bio: '' })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (open && profile) {
      setForm({ first_name: profile.first_name || '', last_name: profile.last_name || '', username: profile.username, bio: profile.bio || '' })
      setAvatar(null); setPreview(null)
    }
  }, [open, profile])

  const pick = (f) => {
    if (!f) return
    try { validateFile(f, 'avatars') } catch (e) { toast.error(e.message); return }
    setAvatar(f); setPreview(URL.createObjectURL(f))
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      let p = await updateProfile(profile.id, { first_name: form.first_name.trim(), last_name: form.last_name.trim(), username: form.username, bio: form.bio.trim() })
      if (avatar) p = await uploadAvatar(profile.id, avatar, profile.avatar_url)
      setProfile(p); saveAccount(session, p); onSaved?.(p)
      toast.success('Profile updated'); onClose()
    } catch (err) { toast.error(errorMessage(err)) }
    finally { setBusy(false) }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title={t('editProfile')} size="md">
      <form onSubmit={save} className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => ref.current?.click()} className="group relative" aria-label="Change photo">
            <Avatar src={preview || profile?.avatar_url} name={fullName(profile)} size={84} />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100"><Camera size={22} /></span>
          </button>
          <div>
            <button type="button" className="btn-ghost" onClick={() => ref.current?.click()}>Change photo</button>
            <p className="mt-1.5 text-xs text-fg/50">JPG, PNG or WebP · up to 5 MB</p>
          </div>
          <input ref={ref} type="file" hidden accept="image/*" onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="ep-fn">First name</label><input id="ep-fn" className="input" value={form.first_name} onChange={set('first_name')} maxLength={40} /></div>
          <div><label className="label" htmlFor="ep-ln">Last name</label><input id="ep-ln" className="input" value={form.last_name} onChange={set('last_name')} maxLength={40} /></div>
        </div>
        <div><label className="label" htmlFor="ep-un">Username</label><input id="ep-un" className="input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))} maxLength={30} required /></div>
        <div>
          <label className="label" htmlFor="ep-bio">Bio</label>
          <textarea id="ep-bio" className="input resize-none" rows={3} value={form.bio} onChange={set('bio')} maxLength={300} />
          <p className="mt-1 text-right text-xs text-fg/40">{form.bio.length}/300</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary min-w-[110px]" disabled={busy}>{busy ? <Spinner size={16} className="text-white" /> : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  )
}
