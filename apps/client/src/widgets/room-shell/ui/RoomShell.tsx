import type { ReactNode } from 'react'

interface RoomShellProps {
  isNight: boolean
  children: ReactNode
}

export function RoomShell({ isNight, children }: RoomShellProps) {
  return (
    <div
      className={`min-h-screen text-white font-[system-ui,sans-serif] transition-[background] duration-1000 ${
        isNight ? 'bg-[#05051a]' : 'bg-[#0a0a1a]'
      }`}
    >
      {children}
    </div>
  )
}

export function RoomContent({ children }: { children: ReactNode }) {
  return <div className="max-w-[900px] mx-auto pt-[60px] px-5 pb-5">{children}</div>
}
