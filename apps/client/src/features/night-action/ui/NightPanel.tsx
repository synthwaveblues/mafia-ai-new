import type { Player, Role } from '@mafia-ai/types'
import { Button } from '@/shared/ui'

interface NightPanelProps {
  players: Player[]
  currentPlayerId: string
  myRole: Role
  onAction: (targetId: string) => void
}

const rolePrompts: Partial<Record<Role, string>> = {
  mafia: 'Choose who to eliminate',
  detective: 'Choose who to investigate',
  doctor: 'Choose who to save',
}

export function NightPanel({ players, currentPlayerId, myRole, onAction }: NightPanelProps) {
  const prompt = rolePrompts[myRole]
  if (!prompt) return null

  const targets = players.filter((p) => p.status === 'alive' && p.id !== currentPlayerId)

  return (
    <div className="p-4 bg-[#1a1a2e] rounded-xl border-2 border-indigo-500 mb-5">
      <h3 className="text-indigo-500 mb-3 text-center font-bold">
        {prompt}
      </h3>
      <div className="flex flex-col gap-2">
        {targets.map((player) => (
          <Button
            key={player.id}
            variant="ghost"
            onClick={() => onAction(player.id)}
          >
            {player.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
