interface GameOverProps {
  winner: 'mafia' | 'civilians'
}

export function GameOver({ winner }: GameOverProps) {
  return (
    <div className="text-center mt-10">
      <h2 className={`text-4xl font-bold ${winner === 'mafia' ? 'text-red-500' : 'text-green-400'}`}>
        {winner === 'mafia' ? 'Mafia Wins!' : 'Civilians Win!'}
      </h2>
    </div>
  )
}
