import { useEffect, useRef } from 'react'
import { useConnection, usePeers, useCamera, useMicrophone, useInitializeDevices } from '@fishjam-cloud/react-client'

export function useFishjamMediaSession(fishjamToken: string | null, playerName: string | null) {
  const { joinRoom, peerStatus } = useConnection()
  const { localPeer, remotePeers } = usePeers()
  const { startCamera } = useCamera()
  const { startMicrophone, toggleMicrophoneMute, isMicrophoneMuted } = useMicrophone()
  const { initializeDevices } = useInitializeDevices()
  const fishjamJoinInitiated = useRef(false)

  useEffect(() => {
    if (!fishjamToken || fishjamJoinInitiated.current) return
    fishjamJoinInitiated.current = true

    initializeDevices({})
      .then(() =>
        joinRoom({
          peerToken: fishjamToken,
          peerMetadata: { name: playerName ?? '' },
        })
      )
      .then(() => {
        startCamera()
        startMicrophone()
      })
      .catch((err) => {
        console.error('Fishjam setup failed:', err)
        fishjamJoinInitiated.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishjamToken])

  return {
    peerStatus,
    localPeer,
    remotePeers,
    toggleMicrophoneMute,
    isMicrophoneMuted,
  }
}
