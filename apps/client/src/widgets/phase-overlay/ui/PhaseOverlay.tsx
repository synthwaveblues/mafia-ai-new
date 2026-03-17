import { useState, useEffect } from 'react'
import type { Phase } from '@mafia-ai/types'

const phaseDisplay: Record<Phase, { label: string; color: string; bg: string; icon: string }> = {
  lobby: { label: 'Lobby', color: '#60a5fa', bg: 'transparent', icon: '' },
  role_assignment: { label: 'Roles Assigned', color: '#a78bfa', bg: 'rgba(0,0,0,0.9)', icon: '\u{1F3AD}' },
  night: { label: 'Night Falls', color: '#6366f1', bg: 'rgba(10,10,40,0.95)', icon: '\u{1F319}' },
  day: { label: 'Dawn Breaks', color: '#fbbf24', bg: 'rgba(40,30,10,0.9)', icon: '\u2600\uFE0F' },
  voting: { label: 'Vote Now', color: '#e11d48', bg: 'rgba(40,10,10,0.9)', icon: '\u{1F5F3}\uFE0F' },
  game_over: { label: 'Game Over', color: '#fff', bg: 'rgba(0,0,0,0.95)', icon: '\u{1F480}' },
}

interface PhaseOverlayProps {
  phase: Phase
}

export function PhaseOverlay({ phase }: PhaseOverlayProps) {
  const [showSplash, setShowSplash] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(phase)

  useEffect(() => {
    if (phase !== currentPhase && phase !== 'lobby') {
      setCurrentPhase(phase)
      setShowSplash(true)
      const timer = setTimeout(() => setShowSplash(false), 2000)
      return () => clearTimeout(timer)
    }
    setCurrentPhase(phase)
  }, [phase, currentPhase])

  const info = phaseDisplay[phase]
  if (phase === 'lobby') return null

  return (
    <>
      {/* Phase splash -- full screen, fades out */}
      {showSplash && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-out pointer-events-none"
          style={{ background: info.bg }}
        >
          <span className="text-6xl mb-4">{info.icon}</span>
          <span
            className="text-4xl font-black uppercase tracking-widest"
            style={{ color: info.color }}
          >
            {info.label}
          </span>
        </div>
      )}

      {/* Persistent top bar */}
      <div className="fixed top-0 left-0 right-0 py-2 text-center z-40 pointer-events-none">
        <span
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: info.color }}
        >
          {info.icon} {info.label}
        </span>
      </div>
    </>
  )
}
