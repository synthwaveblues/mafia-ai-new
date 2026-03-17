import { useGameStore } from '@/entities/game'

export function AiAnalysis() {
  const behavioralNotes = useGameStore((s) => s.behavioralNotes)
  const suspicions = useGameStore((s) => s.suspicions)

  if (behavioralNotes.length === 0 && Object.keys(suspicions).length === 0) {
    return null
  }

  // Show last 5 notes
  const recentNotes = behavioralNotes.slice(-5)

  return (
    <div className="bg-[#0f0f1a] border border-[#333] rounded-xl p-4 mb-4">
      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        AI Analysis — Live
      </h3>

      {recentNotes.length > 0 && (
        <div className="space-y-1.5">
          {recentNotes.map((note, i) => (
            <div key={i} className="text-xs">
              <span className="text-amber-300 font-bold">{note.playerName}:</span>{' '}
              <span className="text-[#aaa] italic">{note.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
