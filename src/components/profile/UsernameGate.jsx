import Modal from '../common/Modal'
import UsernameForm from './UsernameForm'
import { useAuthStore } from '../../store/authStore'

// Shown once to accounts created with Google, where the username was generated automatically
export default function UsernameGate() {
  const profile = useAuthStore((s) => s.profile)
  const open = Boolean(profile && profile.username_confirmed === false)
  return (
    <Modal open={open} onClose={() => {}} title="Choose your username" size="sm">
      <div className="p-5">
        <p className="mb-4 text-sm text-fg/65">This is how people find and mention you. You can change it later in Settings.</p>
        <UsernameForm submitLabel="Continue" />
      </div>
    </Modal>
  )
}