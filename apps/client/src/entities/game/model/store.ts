import { create } from 'zustand'
import type { GameState, Role } from '@mafia-ai/types'

interface GameStore {
  roomId: string | null
  playerId: string | null
  playerName: string | null
  myRole: Role | null
  gameState: GameState | null
  fishjamToken: string | null
  lastTranscript: { speaker: 'gemini' | 'player'; text: string } | null
  votes: Record<string, string>
  suspicions: Record<string, { score: number; reason: string }>
  behavioralNotes: Array<{ playerName: string; note: string; timestamp: number }>
  faceMetrics: { stress: number; surprise: number; happiness: number; lookingAway: boolean } | null
  currentSpeakerId: string | null
  pendingBotSpeech: { playerName: string; message: string } | null

  setRoomId: (id: string) => void
  setPlayerId: (id: string) => void
  setPlayerName: (name: string) => void
  setMyRole: (role: Role) => void
  setGameState: (state: GameState) => void
  setFishjamToken: (token: string) => void
  setLastTranscript: (t: { speaker: 'gemini' | 'player'; text: string }) => void
  addVote: (fromId: string, targetId: string) => void
  clearVotes: () => void
  updateSuspicion: (playerId: string, score: number, reason: string) => void
  addBehavioralNote: (playerName: string, note: string) => void
  setFaceMetrics: (m: { stress: number; surprise: number; happiness: number; lookingAway: boolean }) => void
  setCurrentSpeaker: (id: string | null) => void
  setPendingBotSpeech: (s: { playerName: string; message: string } | null) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  roomId: null,
  playerId: null,
  playerName: null,
  myRole: null,
  gameState: null,
  fishjamToken: null,
  lastTranscript: null,
  votes: {},
  suspicions: {},
  behavioralNotes: [],
  faceMetrics: null,
  currentSpeakerId: null,
  pendingBotSpeech: null,

  setRoomId: (roomId) => set({ roomId }),
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (playerName) => set({ playerName }),
  setMyRole: (myRole) => set({ myRole }),
  setGameState: (gameState) => set({ gameState }),
  setFishjamToken: (fishjamToken) => set({ fishjamToken }),
  setLastTranscript: (lastTranscript) => set({ lastTranscript }),
  addVote: (fromId, targetId) => set((state) => ({ votes: { ...state.votes, [fromId]: targetId } })),
  clearVotes: () => set({ votes: {} }),
  updateSuspicion: (playerId, score, reason) => set((state) => ({
    suspicions: { ...state.suspicions, [playerId]: { score, reason } }
  })),
  addBehavioralNote: (playerName, note) => set((state) => ({
    behavioralNotes: [...state.behavioralNotes.slice(-20), { playerName, note, timestamp: Date.now() }]
  })),
  setFaceMetrics: (faceMetrics) => set({ faceMetrics }),
  setCurrentSpeaker: (currentSpeakerId) => set({ currentSpeakerId }),
  setPendingBotSpeech: (pendingBotSpeech) => set({ pendingBotSpeech }),
  reset: () => set({ roomId: null, playerId: null, playerName: null, myRole: null, gameState: null, fishjamToken: null, lastTranscript: null, votes: {}, suspicions: {}, behavioralNotes: [], faceMetrics: null, currentSpeakerId: null, pendingBotSpeech: null }),
}))
