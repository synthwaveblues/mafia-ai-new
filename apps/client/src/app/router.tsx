import { Routes, Route } from 'react-router-dom'
import { LobbyPage } from '@/pages/lobby'
import { RoomPage } from '@/pages/room'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LobbyPage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
    </Routes>
  )
}
