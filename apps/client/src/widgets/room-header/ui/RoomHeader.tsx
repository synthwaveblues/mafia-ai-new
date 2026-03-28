import type { GameState } from '@mafia-ai/types'

interface RoomHeaderProps {
  gameState: GameState
  peerStatus: string
}

export function RoomHeader({ gameState, peerStatus }: RoomHeaderProps) {
  const aliveCount = gameState.players.filter((p) => p.status === 'alive').length

  return (
    <div className="flex justify-between items-center mb-5">
      <div>
        <span className="text-[#888] text-[0.85rem]">Room: </span>
        <span className="text-white font-bold">{gameState.roomId}</span>
      </div>
      <div className="text-[#888] text-[0.85rem]">
        Day {gameState.day} · {aliveCount} alive
        {peerStatus === 'connected' && ' · Video connected'}
      </div>
    </div>
  )
}
