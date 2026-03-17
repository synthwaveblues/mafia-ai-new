import type { Role } from '@mafia-ai/types'

const roleInfo: Record<Role, { emoji: string; color: string; description: string }> = {
  mafia: { emoji: '🔪', color: '#ef4444', description: 'Eliminate civilians at night' },
  civilian: { emoji: '👤', color: '#60a5fa', description: 'Find and vote out the mafia' },
  detective: { emoji: '🔍', color: '#a78bfa', description: 'Investigate one player each night' },
  doctor: { emoji: '💉', color: '#4ade80', description: 'Save one player each night' },
}

interface RoleCardProps {
  role: Role
}

export function RoleCard({ role }: RoleCardProps) {
  const info = roleInfo[role]
  return (
    <div
      className="p-5 rounded-xl text-center max-w-[200px]"
      style={{
        background: `linear-gradient(135deg, ${info.color}22, ${info.color}11)`,
        border: `2px solid ${info.color}`,
      }}
    >
      <div className="text-5xl">{info.emoji}</div>
      <div className="text-[1.2rem] font-bold uppercase mt-2" style={{ color: info.color }}>
        {role}
      </div>
      <div className="text-[0.85rem] text-[#aaa] mt-2">
        {info.description}
      </div>
    </div>
  )
}
