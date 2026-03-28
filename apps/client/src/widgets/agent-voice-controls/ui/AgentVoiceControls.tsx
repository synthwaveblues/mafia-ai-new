import type { Player } from '@mafia-ai/types'

export type AgentVoiceControlsSize = 'compact' | 'default'

export interface AgentVoiceControlsProps {
  voiceAgentIds: string[]
  players: Player[]
  agentsMuted: boolean
  selectedAgentIds: string[]
  /** When true, master toggle is disabled and shows "AI MUTED" (night / role_assignment). */
  phaseLocked: boolean
  size?: AgentVoiceControlsSize
  onToggleAgentsMuted: () => void
  onToggleAgentSelected: (agentId: string, selected: boolean) => void
}

const masterBaseCompact =
  'px-3 py-1.5 rounded-full font-bold text-xs transition-all duration-200'
const masterBaseDefault = 'px-4 py-2 rounded-lg font-bold text-xs transition-colors'
const agentBaseCompact =
  'px-3 py-1.5 rounded-full font-bold text-xs transition-all duration-200'
const agentBaseDefault = 'px-3 py-2 rounded-lg font-bold text-xs transition-colors'

export function AgentVoiceControls({
  voiceAgentIds,
  players,
  agentsMuted,
  selectedAgentIds,
  phaseLocked,
  size = 'compact',
  onToggleAgentsMuted,
  onToggleAgentSelected,
}: AgentVoiceControlsProps) {
  if (voiceAgentIds.length === 0) return null

  const agentPlayers = players.filter((p) => voiceAgentIds.includes(p.id))
  const masterBase = size === 'compact' ? masterBaseCompact : masterBaseDefault
  const agentBase = size === 'compact' ? agentBaseCompact : agentBaseDefault

  const masterClass = phaseLocked
    ? `${masterBase} bg-gray-700/80 text-gray-400 cursor-not-allowed`
    : agentsMuted
      ? `${masterBase} bg-red-600/80 hover:bg-red-600 text-white`
      : `${masterBase} bg-purple-600/80 hover:bg-purple-600 text-white`

  const masterLabel = phaseLocked ? 'AI MUTED' : agentsMuted ? 'AI OFF' : 'AI ON'
  const masterTitle = phaseLocked
    ? 'AI agents are always muted in this phase'
    : agentsMuted
      ? 'Unmute AI agents'
      : 'Mute AI agents'

  return (
    <>
      <button
        type="button"
        disabled={phaseLocked}
        onClick={() => !phaseLocked && onToggleAgentsMuted()}
        className={masterClass}
        title={masterTitle}
      >
        {masterLabel}
      </button>
      {agentPlayers.map((agent) => {
        const isSelected = selectedAgentIds.includes(agent.id)
        const isOnlyOne = selectedAgentIds.length <= 1 && isSelected
        const disabled = phaseLocked || agentsMuted || isOnlyOne
        const agentClass =
          phaseLocked || agentsMuted
            ? `${agentBase} bg-gray-700/60 text-gray-500 cursor-not-allowed`
            : isSelected
              ? `${agentBase} bg-emerald-600/80 hover:bg-emerald-600 text-white cursor-not-allowed`
              : `${agentBase} bg-gray-600/80 hover:bg-gray-500/80 text-gray-300`

        return (
          <button
            key={agent.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onToggleAgentSelected(agent.id, !isSelected)}
            className={agentClass}
            title={
              isOnlyOne
                ? 'At least one agent must be active'
                : isSelected
                  ? `Mute ${agent.name}`
                  : `Unmute ${agent.name}`
            }
          >
            {agent.name}
          </button>
        )
      })}
    </>
  )
}
