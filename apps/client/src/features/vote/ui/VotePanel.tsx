import { useState } from 'react'
import type { Player } from '@mafia-ai/types'
import { Button } from '@/shared/ui'

interface VotePanelProps {
  players: Player[]
  currentPlayerId: string
  onVote: (targetId: string) => void
}

export function VotePanel({ players, currentPlayerId, onVote }: VotePanelProps) {
  const [votedForId, setVotedForId] = useState<string | null>(null)
  const alivePlayers = players.filter((p) => p.status === 'alive' && p.id !== currentPlayerId)

  if (votedForId) {
    const target = players.find((p) => p.id === votedForId)
    return (
      <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-green-500">
        <div className="text-center">
          <span className="text-2xl">🗳️</span>
          <h3 className="text-green-400 font-bold mt-1">Voted: {target?.name}</h3>
          <p className="text-[#666] text-xs mt-2">Waiting for other votes...</p>
        </div>
      </div>
    )
  }

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
            onClick={() => {
              setVotedForId(player.id)
              onVote(player.id)
            }}
            className="hover:bg-rose-600/20 hover:border-rose-600"
          >
            {player.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
