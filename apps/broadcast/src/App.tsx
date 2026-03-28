import { useEffect, useState } from 'react'
import type { GameState, Phase } from '@mafia-ai/types'
import { BroadcastScene, type BroadcastPlayer } from './scene'

const WS_URL = import.meta.env.VITE_SERVER_WS_URL || 'wss://server-production-dd31.up.railway.app/ws'
// Room ID from URL query param ?room=xxx, or env var, or fallback
const ROOM_ID = new URLSearchParams(location.search).get('room')
  ?? import.meta.env.VITE_GAME_ROOM_ID
  ?? 'broadcast-room'

export function App() {
  const [players, setPlayers] = useState<BroadcastPlayer[]>([])
  const [phase, setPhase] = useState<Phase>('lobby')
  const [day, setDay] = useState(1)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let ws: WebSocket
    let cancelled = false

    function connect() {
      if (cancelled) return
      ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        setConnected(true)
        ws.send(JSON.stringify({ type: 'join_room', roomId: ROOM_ID, playerName: '📺 Spectator' }))
      }

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return
        let msg: Record<string, unknown>
        try { msg = JSON.parse(event.data as string) } catch { return }

        const state = msg.state as GameState | undefined

        if (msg.type === 'room_joined' || msg.type === 'phase_changed' || msg.type === 'game_started') {
          if (state) syncState(state)
        }
        if (msg.type === 'game_over' && state) {
          syncState(state)
        }
        if (msg.type === 'stress_alert') {
          const name = (msg as Record<string, string>).playerName
          const level = (msg as Record<string, number>).level
          setPlayers((prev) =>
            prev.map((p) => p.name === name ? { ...p, isStressed: level > 0.3 } : p)
          )
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!cancelled) setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    }

    function syncState(state: GameState) {
      setPhase(state.phase)
      setDay(state.day)
      setPlayers((prev) =>
        state.players
          .filter((p) => !p.name.startsWith('📺'))
          .map((p) => ({
            name: p.name,
            role: p.role,
            status: p.status,
            isStressed: prev.find((bp) => bp.name === p.name)?.isStressed ?? false,
          }))
      )
    }

    connect()
    return () => {
      cancelled = true
      ws?.close()
    }
  }, [])

  return (
    <div className="w-screen h-screen">
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
          <p className="text-white/60 text-lg">Connecting to game server…</p>
        </div>
      )}
      <BroadcastScene players={players} phase={phase} day={day} />
    </div>
  )
}
