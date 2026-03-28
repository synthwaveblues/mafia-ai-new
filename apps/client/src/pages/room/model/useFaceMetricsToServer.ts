import { useEffect } from 'react'
import { useGameStore } from '@/entities/game'
import type { ClientEvent } from '@mafia-ai/types'
import type { FaceMetrics } from '@/entities/game'

export function useFaceMetricsToServer(
  onMetrics: (cb: (m: FaceMetrics) => void) => void,
  send: (event: ClientEvent) => void
) {
  useEffect(() => {
    onMetrics((m) => {
      useGameStore.getState().setFaceMetrics(m)
      send({
        type: 'face_metrics',
        stress: m.stress,
        surprise: m.surprise,
        happiness: m.happiness,
        lookingAway: m.lookingAway,
      })
    })
  }, [onMetrics, send])
}
