import { useGameStore } from '@/entities/game'

export function VotePanel() {
  const { gameState, playerId, votes } = useGameStore()

  if (!gameState || !playerId) return null

  const myVoteTargetId = votes[playerId]
  const myVoteTarget = myVoteTargetId
    ? gameState.players.find((p) => p.id === myVoteTargetId)
    : null

  const voiceAgentIds = new Set(gameState.voiceAgentIds ?? [])
  const unvotedHumans = gameState.players.filter(
    (p) => p.status === 'alive' && !voiceAgentIds.has(p.id) && !votes[p.id]
  )
  const currentVoterId = unvotedHumans[0]?.id ?? null
  const isMyTurn = currentVoterId === playerId

  if (myVoteTarget) {
    return (
      <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-green-600/60 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Your vote recorded</p>
        <p className="text-green-400 font-bold text-lg">{myVoteTarget.name}</p>
        <p className="text-[#555] text-xs mt-2">Waiting for other votes...</p>
      </div>
    )
  }

  if (isMyTurn) {
    return (
      <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
        <div className="flex flex-col items-center gap-3">
          <p className="text-3xl">🗳️</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-red-400 text-sm font-bold tracking-wider uppercase">Your Turn — Vote Now</p>
          </div>
          <p className="text-white text-sm text-center">Say the name of who you want to eliminate</p>
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

  const waitingFor = currentVoterId
    ? gameState.players.find((p) => p.id === currentVoterId)?.name
    : null

  return (
    <div className="p-5 bg-[#1a1a2e] rounded-xl border-2 border-[#333] text-center">
      {waitingFor ? (
        <>
          <p className="text-2xl mb-2">🎙️</p>
          <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Game Master is asking</p>
          <p className="text-amber-400 font-bold text-base">{waitingFor}</p>
        </>
      ) : (
        <p className="text-[#666] text-sm italic">Tallying votes...</p>
      )}
    </div>
  )
}
