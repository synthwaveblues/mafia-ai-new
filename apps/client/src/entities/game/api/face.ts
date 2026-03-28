import { useEffect, useRef, useCallback, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export interface FaceMetrics {
  stress: number      // 0-1, based on brow compression + lip tightness
  surprise: number    // 0-1, based on eye wideness + brow raise
  happiness: number   // 0-1, based on mouth corners
  lookingAway: boolean // head turned significantly
}

const ANALYSIS_INTERVAL = 3000 // every 3 seconds

export function useFaceAnalysis() {
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null)
  const [isReady, setIsReady] = useState(false)
  const onMetricsCallback = useRef<((metrics: FaceMetrics) => void) | null>(null)

  // Initialize MediaPipe
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        if (cancelled) return

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
        })

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        setIsReady(true)
        console.log('MediaPipe FaceLandmarker ready')
      } catch (err) {
        console.error('Failed to initialize MediaPipe:', err)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // Set the video element to analyze
  const setVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
  }, [])

  // Start periodic analysis
  const startAnalysis = useCallback(() => {
    if (intervalRef.current) return

    intervalRef.current = setInterval(() => {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      if (!video || !landmarker || video.readyState < 2) return

      try {
        const result = landmarker.detectForVideo(video, performance.now())

        if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
          const shapes = result.faceBlendshapes[0].categories
          const getScore = (name: string): number => {
            const cat = shapes.find(c => c.categoryName === name)
            return cat?.score ?? 0
          }

          // Calculate metrics from blendshapes
          const browDown = (getScore('browDownLeft') + getScore('browDownRight')) / 2
          const browUp = (getScore('browInnerUp') + getScore('browOuterUpLeft') + getScore('browOuterUpRight')) / 3
          const eyeWide = (getScore('eyeWideLeft') + getScore('eyeWideRight')) / 2
          const mouthSmile = (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2
          const jawOpen = getScore('jawOpen')
          const mouthPress = (getScore('mouthPressLeft') + getScore('mouthPressRight')) / 2
          const eyeBlink = (getScore('eyeBlinkLeft') + getScore('eyeBlinkRight')) / 2

          // Head turn detection using face landmarks
          // Nose tip is landmark 1; if it deviates significantly from center x, player is looking away
          const landmarks = result.faceLandmarks?.[0]
          let lookingAway = false
          if (landmarks && landmarks.length > 1) {
            const noseTip = landmarks[1]
            lookingAway = Math.abs(noseTip.x - 0.5) > 0.15
          }

          const faceMetrics: FaceMetrics = {
            stress: Math.min(1, (browDown * 0.4 + mouthPress * 0.3 + eyeBlink * 0.3)),
            surprise: Math.min(1, (eyeWide * 0.4 + browUp * 0.4 + jawOpen * 0.2)),
            happiness: Math.min(1, mouthSmile),
            lookingAway,
          }

          setMetrics(faceMetrics)
          onMetricsCallback.current?.(faceMetrics)
        }
      } catch (_err) {
        // Silently ignore analysis errors
      }
    }, ANALYSIS_INTERVAL)

    console.log('Face analysis started')
  }, [])

  const stopAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const onMetrics = useCallback((cb: (metrics: FaceMetrics) => void) => {
    onMetricsCallback.current = cb
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      stopAnalysis()
      landmarkerRef.current?.close()
    }
  }, [stopAnalysis])

  return { metrics, isReady, setVideoElement, startAnalysis, stopAnalysis, onMetrics }
}
