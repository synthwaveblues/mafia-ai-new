import { useState } from 'react'
import { Button } from '@/shared/ui'
import { Input } from '@/shared/ui'

interface JoinFormProps {
  onJoin: (name: string, roomId: string) => void
}

export function JoinForm({ onJoin }: JoinFormProps) {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) return
    const room = roomId.trim() || crypto.randomUUID().slice(0, 8)
    onJoin(name.trim(), room)
  }

  return (
    <div className="flex flex-col gap-4 w-[300px]">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <Input
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Room code (leave empty to create)"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <Button
        variant="primary"
        size="lg"
        onClick={handleSubmit}
        disabled={!name.trim()}
      >
        Join Game
      </Button>
    </div>
  )
}
