import { Button } from '@/shared/ui'

interface StartButtonProps {
  playerCount: number
  minPlayers: number
  onStart: () => void
}

export function StartButton({ playerCount, minPlayers, onStart }: StartButtonProps) {
  if (playerCount >= minPlayers) {
    return (
      <div className="text-center mt-5">
        <Button variant="danger" size="lg" onClick={onStart}>
          Start Game
        </Button>
      </div>
    )
  }

  return (
    <p className="text-center text-[#888] mt-5">
      Waiting for players... ({playerCount}/{minPlayers} minimum)
    </p>
  )
}
