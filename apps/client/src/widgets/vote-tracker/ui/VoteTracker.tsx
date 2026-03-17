import { useGameStore } from '@/entities/game'
import type { Player } from '@mafia-ai/types'

interface VoteTrackerProps {
  players: Player[]
}

export function VoteTracker({ players }: VoteTrackerProps) {
  const votes = useGameStore((s) => s.votes)

  // Count votes per target
  const voteCounts = new Map<string, number>()
  Object.values(votes).forEach((targetId) => {
    voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1)
  })

  const totalVotes = Object.keys(votes).length
  const alivePlayers = players.filter((p) => p.status === 'alive')
  const maxPossibleVotes = alivePlayers.length

  return (
    <div className="bg-[#1a1a2e] rounded-xl p-4 border border-[#333] mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-rose-400">Live Votes</h3>
        <span className="text-xs text-[#888]">{totalVotes}/{maxPossibleVotes}</span>
      </div>
      <div className="space-y-2">
        {alivePlayers.map((player) => {
          const count = voteCounts.get(player.id) || 0
          const percent = maxPossibleVotes > 0 ? (count / maxPossibleVotes) * 100 : 0
          return (
            <div key={player.id} className="flex items-center gap-2">
              <span className="text-xs text-[#ccc] w-20 truncate">{player.name}</span>
              <div className="flex-1 h-2 bg-[#222] rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {count > 0 && <span className="text-xs text-rose-400 font-bold w-4">{count}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
