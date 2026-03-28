import { useCallback, useEffect, useRef } from 'react'

// Assign different voice indices to each bot
const botVoiceMap = new Map<string, number>()
let nextVoiceIndex = 0

function getVoiceForBot(botName: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) return null

  if (!botVoiceMap.has(botName)) {
    botVoiceMap.set(botName, nextVoiceIndex++)
  }

  const index = botVoiceMap.get(botName)!
  // Pick English voices, skip the first one (often default/narrator-like)
  const englishVoices = voices.filter(v => v.lang.startsWith('en'))
  const pool = englishVoices.length > 1 ? englishVoices : voices
  return pool[index % pool.length] || voices[0]
}

export function useBotTTS() {
  const isSpeaking = useRef(false)
  const queue = useRef<Array<{ name: string; message: string; onDone?: () => void }>>([])

  // Ensure voices are loaded
  useEffect(() => {
    speechSynthesis.getVoices()
    const handler = () => speechSynthesis.getVoices()
    speechSynthesis.addEventListener('voiceschanged', handler)
    return () => speechSynthesis.removeEventListener('voiceschanged', handler)
  }, [])

  const processQueue = useCallback(() => {
    if (isSpeaking.current || queue.current.length === 0) return

    const item = queue.current.shift()!
    isSpeaking.current = true

    const utterance = new SpeechSynthesisUtterance(item.message)
    const voice = getVoiceForBot(item.name)
    if (voice) utterance.voice = voice
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onend = () => {
      isSpeaking.current = false
      item.onDone?.()
      processQueue()
    }
    utterance.onerror = () => {
      isSpeaking.current = false
      processQueue()
    }

    console.log(`[TTS] ${item.name} speaking: "${item.message}" (voice: ${voice?.name || 'default'})`)
    speechSynthesis.speak(utterance)
  }, [])

  const speak = useCallback((botName: string, message: string) => {
    queue.current.push({ name: botName, message })
    processQueue()
  }, [processQueue])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    queue.current = []
    isSpeaking.current = false
  }, [])

  return { speak, stop }
}
