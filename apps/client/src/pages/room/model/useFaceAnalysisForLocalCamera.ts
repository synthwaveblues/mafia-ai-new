import { useEffect } from 'react'
import type { PeerWithTracks } from '@fishjam-cloud/react-client'

type LocalFishjamPeer = PeerWithTracks<Record<string, unknown>, Record<string, unknown>> | null

export function useFaceAnalysisForLocalCamera(
  localPeer: LocalFishjamPeer,
  setVideoElement: (el: HTMLVideoElement | null) => void,
  startAnalysis: () => void,
  stopAnalysis: () => void
) {
  useEffect(() => {
    if (localPeer?.cameraTrack?.stream) {
      const video = document.createElement('video')
      video.srcObject = localPeer.cameraTrack.stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      video.play()
      setVideoElement(video)
      startAnalysis()

      return () => {
        stopAnalysis()
        video.srcObject = null
        setVideoElement(null)
      }
    }
  }, [localPeer?.cameraTrack?.stream, setVideoElement, startAnalysis, stopAnalysis])
}
