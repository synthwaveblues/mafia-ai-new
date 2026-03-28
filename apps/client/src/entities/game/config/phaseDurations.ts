import type { Phase } from '@mafia-ai/types'

export const PHASE_DURATIONS: Partial<Record<Phase, number>> = {
  night: 45,
  day: 80,
  voting: 40,
}
