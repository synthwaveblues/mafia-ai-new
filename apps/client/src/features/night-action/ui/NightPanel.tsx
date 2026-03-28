import { useGameStore } from '@/entities/game'

const ROLE_CONFIG: Record<string, { prompt: string; icon: string; color: string; confirmIcon: string }> = {
  mafia: {
    prompt: 'Choose who to eliminate',
    icon: '🔪',
    color: 'red',
    confirmIcon: '☠️',
  },
  detective: {
    prompt: 'Choose who to investigate',
    icon: '🔍',
    color: 'purple',
    confirmIcon: '🕵️',
  },
  doctor: {
    prompt: 'Choose who to protect',
    icon: '💉',
    color: 'emerald',
    confirmIcon: '🛡️',
  },
}

interface NightPanelProps {
  onAction?: (targetId: string) => void
}

export function NightPanel({ onAction }: NightPanelProps) {
  const { myRole, gameState, playerId } = useGameStore()
  const nightActionWindowOpen = useGameStore((s) => s.nightActionWindowOpen)
  const nightActionSubmitted = useGameStore((s) => s.nightActionSubmitted)
  const nightActionTargetName = useGameStore((s) => s.nightActionTargetName)

  if (!myRole || !gameState) return null

  const config = ROLE_CONFIG[myRole]

  if (myRole === 'civilian') {
    return (
      <div className="p-4 bg-[#1a1a2e] rounded-xl border-2 border-indigo-800/50 mb-5 text-center">
        <p className="text-2xl mb-2">😴</p>
        <p className="text-indigo-300 text-sm">The night is not yours. Sleep and hope for the best...</p>
      </div>
    )
  }

  if (!config) return null

  if (nightActionSubmitted) {
    return (
      <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-green-600/60 mb-5 text-center">
        <p className="text-3xl mb-2">{config.confirmIcon}</p>
        <p className="text-green-400 text-sm font-bold">Action confirmed</p>
        {nightActionTargetName && (
          <p className="text-white text-base font-bold mt-1">Target: {nightActionTargetName}</p>
        )}
        <p className="text-[#666] text-xs mt-2">Waiting for dawn...</p>
      </div>
    )
  }

  if (nightActionWindowOpen) {
    const targets = gameState.players.filter((p) => p.status === 'alive' && p.id !== playerId)

    return (
      <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-red-600 mb-5 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
        <div className="flex flex-col items-center gap-3">
          <p className="text-3xl">{config.icon}</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-red-400 text-sm font-bold tracking-wider uppercase">Your Turn</p>
          </div>
          <p className="text-white text-sm text-center">{config.prompt}</p>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {targets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onAction?.(p.id)}
                className="px-4 py-2 bg-white/10 hover:bg-red-600/60 border border-white/20 hover:border-red-500 rounded-lg text-white text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-[#555] text-[10px] mt-1">Tap a name or say it aloud</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-[#1a1a2e] rounded-xl border-2 border-indigo-800/50 mb-5 text-center">
      <p className="text-2xl mb-2">{config.icon}</p>
      <p className="text-indigo-400 text-sm italic">Waiting for your turn...</p>
    </div>
  )
}
