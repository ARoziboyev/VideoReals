import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import supabase from '../../lib/supabase'
import Avatar from '../common/Avatar'
import StoryViewer from './StoryViewer'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { fetchActiveStories, getViewedIds } from '../../services/storyService'
import { useT } from '../../lib/i18n'
import { fullName } from '../../lib/utils'

export default function StoriesBar() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setStoryOpen = useUIStore((s) => s.setStoryOpen)
  const [groups, setGroups] = useState([])
  const [viewed, setViewed] = useState(new Set())
  const [openIndex, setOpenIndex] = useState(null)

  const load = useCallback(async () => {
    try {
      const all = await fetchActiveStories()
      const mine = all.filter((g) => g.user?.id === user.id)
      const others = all.filter((g) => g.user?.id !== user.id)
      const ids = others.flatMap((g) => g.stories.map((s) => s.id))
      const v = await getViewedIds(ids, user.id)
      others.sort((a, b) => Number(a.stories.every((s) => v.has(s.id))) - Number(b.stories.every((s) => v.has(s.id))))
      setViewed(v); setGroups([...mine, ...others])
    } catch { /* feed still works without stories */ }
  }, [user.id])

  useEffect(() => {
    load()
    const onCreated = () => load()
    window.addEventListener('vm:story-created', onCreated)
    const ch = supabase.channel('stories-feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, load).subscribe()
    return () => { window.removeEventListener('vm:story-created', onCreated); supabase.removeChannel(ch) }
  }, [load])

  const myGroupIndex = groups.findIndex((g) => g.user?.id === user.id)

  return (
    <>
      <div className="scrollbar-none flex gap-4 overflow-x-auto px-4 py-4">
        <div className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
          <div className="relative">
            <button onClick={() => (myGroupIndex >= 0 ? setOpenIndex(myGroupIndex) : setStoryOpen(true))} aria-label={t('yourStory')}>
              <Avatar src={profile?.avatar_url} name={fullName(profile)} size={66} ring={myGroupIndex >= 0 ? 'active' : null} />
            </button>
            <button onClick={() => setStoryOpen(true)} aria-label={t('createStory')}
              className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-[rgb(var(--bg))] text-white"
              style={{ backgroundImage: 'linear-gradient(135deg,#8B5CF6,#EC4899)' }}>
              <Plus size={13} strokeWidth={3} />
            </button>
          </div>
          <span className="w-full truncate text-center text-xs text-fg/70">{t('yourStory')}</span>
        </div>
        {groups.map((g, i) => g.user?.id === user.id ? null : (
          <button key={g.user?.id} onClick={() => setOpenIndex(i)} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
            <Avatar src={g.user?.avatar_url} name={fullName(g.user)} size={66} ring={g.stories.every((s) => viewed.has(s.id)) ? 'seen' : 'active'} />
            <span className="w-full truncate text-center text-xs text-fg/70">{g.user?.username}</span>
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <StoryViewer groups={groups} startIndex={openIndex}
          onClose={() => { setOpenIndex(null); load() }}
          onViewed={(id) => setViewed((s) => new Set(s).add(id))} />
      )}
    </>
  )
}
