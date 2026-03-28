import type { GameState } from '@mafia-ai/types'
import { AgentVoiceControls } from '@/widgets/agent-voice-controls'

interface LobbyVoiceSetupProps {
  gameState: GameState
  agentsMuted: boolean
  selectedAgentIds: string[]
  onAddVoiceAgent: () => void
  onToggleAgentsMuted: () => void
  onToggleAgentSelected: (agentId: string, selected: boolean) => void
}

export function LobbyVoiceSetup({
  gameState,
  agentsMuted,
  selectedAgentIds,
  onAddVoiceAgent,
  onToggleAgentsMuted,
  onToggleAgentSelected,
}: LobbyVoiceSetupProps) {
  const agentCount = gameState.voiceAgentIds?.length ?? 0
  const atLimit = agentCount >= 3

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onAddVoiceAgent}
        disabled={atLimit}
        className={`px-6 py-2.5 rounded-lg font-bold transition-colors ${
          atLimit ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        {atLimit ? 'AI Agent Limit Reached (3/3)' : `+ Add Voice Agent (${agentCount}/3)`}
      </button>
      {agentCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <AgentVoiceControls
            voiceAgentIds={gameState.voiceAgentIds}
            players={gameState.players}
            agentsMuted={agentsMuted}
            selectedAgentIds={selectedAgentIds}
            phaseLocked={false}
            size="default"
            onToggleAgentsMuted={onToggleAgentsMuted}
            onToggleAgentSelected={onToggleAgentSelected}
          />
        </div>
      )}
    </div>
  )
}
