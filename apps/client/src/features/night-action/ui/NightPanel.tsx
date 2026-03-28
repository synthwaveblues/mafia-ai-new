import { useGameStore } from '@/entities/game'

const ROLE_CONFIG: Record<string, { prompt: string; icon: string; color: string; confirmIcon: string }> = {
  mafia: {
    prompt: 'Say the name of who you want to eliminate',
    icon: '🔪',
    color: 'red',
    confirmIcon: '☠️',
  },
  detective: {
    prompt: 'Say the name of who you want to investigate',
    icon: '🔍',
    color: 'purple',
    confirmIcon: '🕵️',
  },
  doctor: {
    prompt: 'Say the name of who you want to protect',
    icon: '💉',
    color: 'emerald',
    confirmIcon: '🛡️',
  },
}

export function NightPanel() {
  const { myRole, gameState, playerId } = useGameStore()
  const nightActionWindowOpen = useGameStore((s) => s.nightActionWindowOpen)
  const nightActionSubmitted = useGameStore((s) => s.nightActionSubmitted)

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
      <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-green-600/60 mb-5 text-center animate-fade-in">
        <p className="text-3xl mb-2">{config.confirmIcon}</p>
        <p className="text-green-400 text-sm font-bold">Action confirmed</p>
        <p className="text-[#666] text-xs mt-2">Waiting for dawn...</p>
      </div>
    )
  }

  if (nightActionWindowOpen) {
    return (
      <div className={`p-5 bg-[#1a1a2e] rounded-xl border-2 border-${config.color}-600 mb-5 shadow-[0_0_20px_rgba(239,68,68,0.15)]`}>
        <div className="flex flex-col items-center gap-3">
          <p className="text-3xl">{config.icon}</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-red-400 text-sm font-bold tracking-wider uppercase">Mic Live — Speak Now</p>
          </div>
          <p className="text-white text-sm text-center">{config.prompt}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {gameState.players
              .filter((p) => p.status === 'alive' && p.id !== playerId)
              .map((p) => (
                <span key={p.id} className="text-xs bg-white/10 px-2 py-1 rounded text-white/70">
                  {p.name}
                </span>
              ))}
          </div>
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
