import { useEffect } from 'react'
import type { ClientEvent } from '@mafia-ai/types'

export function useSocketJoinRoom(
  roomId: string | undefined,
  playerName: string | null,
  playerId: string | null,
  send: (event: ClientEvent) => void
) {
  useEffect(() => {
    if (roomId && playerName && !playerId) {
      send({ type: 'join_room', roomId, playerName })
    }
  }, [roomId, playerName, playerId, send])
}
