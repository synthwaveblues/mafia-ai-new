import { useEffect } from 'react'
import type { NavigateFunction } from 'react-router-dom'

export function useRedirectIfNoPlayerName(playerName: string | null, navigate: NavigateFunction) {
  useEffect(() => {
    if (!playerName) {
      navigate('/')
    }
  }, [playerName, navigate])
}
