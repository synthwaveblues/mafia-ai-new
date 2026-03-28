import { useEffect, useRef } from 'react'
import type { Phase } from '@mafia-ai/types'

export function usePhaseMicAutoMute(
  phase: Phase | undefined,
  nightActionWindowOpen: boolean,
  isMicrophoneMuted: boolean,
  toggleMicrophoneMute: () => void
) {
  const autoMutedRef = useRef(false)

  useEffect(() => {
    if (!phase) return

    const shouldBeMuted = (phase === 'role_assignment' || phase === 'night') && !nightActionWindowOpen

    if (shouldBeMuted && !isMicrophoneMuted) {
      toggleMicrophoneMute()
    } else if (!shouldBeMuted && isMicrophoneMuted && autoMutedRef.current) {
      toggleMicrophoneMute()
    }

    autoMutedRef.current = shouldBeMuted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, nightActionWindowOpen])
}
