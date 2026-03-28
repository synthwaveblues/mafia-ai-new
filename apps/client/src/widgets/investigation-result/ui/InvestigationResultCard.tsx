import type { Role } from '@mafia-ai/types'

interface InvestigationResultCardProps {
  targetName: string
  targetRole: Role
}

export function InvestigationResultCard({ targetName, targetRole }: InvestigationResultCardProps) {
  return (
    <div className="mb-5 p-4 bg-[#1a1a2e] rounded-xl border-2 border-purple-700 text-center">
      <p className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">Investigation Result</p>
      <p className="text-white text-sm">
        <span className="font-bold">{targetName}</span> is{' '}
        <span className={`font-bold ${targetRole === 'mafia' ? 'text-red-400' : 'text-green-400'}`}>
          {targetRole}
        </span>
      </p>
    </div>
  )
}
