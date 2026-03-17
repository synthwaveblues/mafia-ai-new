import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/entities/game'
import { JoinForm } from '@/features/join-game'

export function LobbyPage() {
  const navigate = useNavigate()
  const { setRoomId, setPlayerName } = useGameStore()

  const handleJoin = (name: string, roomId: string) => {
    setRoomId(roomId)
    setPlayerName(name)
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a1a] text-white font-[system-ui,sans-serif]">
      <h1 className="text-5xl mb-2 font-bold">AI Mafia</h1>
      <p className="text-[#888] mb-10">Powered by Gemini Live</p>
      <JoinForm onJoin={handleJoin} />
    </div>
  )
}
