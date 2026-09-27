const EMOJIS = ['😀','😂','🥹','😍','😘','😎','🤔','😴','😭','😡','👍','👎','👏','🙏','💪','🔥','❤️','💜','💙','💖','✨','🎉','🎬','📸','🎵','⚽','🍕','☕','🌙','⭐','😅','🤩','😇','🤝','👀','💯','✅','❌','🚀','🌸']
export const QUICK_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥']

export default function EmojiPicker({ onPick }) {
  return (
    <div className="grid grid-cols-8 gap-1 rounded-2xl p-2 glass-strong shadow-glass">
      {EMOJIS.map((e) => (
        <button key={e} type="button" onClick={() => onPick(e)} className="grid h-9 w-9 place-items-center rounded-lg text-xl hover:bg-fg/10">{e}</button>
      ))}
    </div>
  )
}
