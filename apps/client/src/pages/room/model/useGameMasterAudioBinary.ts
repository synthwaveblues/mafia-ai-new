import { useEffect } from 'react'

export function useGameMasterAudioBinary(
  setOnBinary: (handler: (data: ArrayBuffer) => void) => void,
  playAudio: (data: ArrayBuffer) => void
) {
  useEffect(() => {
    setOnBinary(playAudio)
  }, [setOnBinary, playAudio])
}
