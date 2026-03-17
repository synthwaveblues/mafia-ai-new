import type { Player } from '@mafia-ai/types'
import { Button } from '@/shared/ui'

interface VotePanelProps {
  players: Player[]
  currentPlayerId: string
  onVote: (targetId: string) => void
}

export function VotePanel({ players, currentPlayerId, onVote }: VotePanelProps) {
  const alivePlayers = players.filter((p) => p.status === 'alive' && p.id !== currentPlayerId)

  return (
    <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-rose-600">
      <h3 className="text-rose-600 mb-4 text-center font-bold">
        Vote to Eliminate
      </h3>
      <div className="flex flex-col gap-2">
        {alivePlayers.map((player) => (
          <Button
            key={player.id}
            variant="ghost"
            onClick={() => onVote(player.id)}
            className="hover:bg-rose-600/20 hover:border-rose-600"
          >
            {player.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
