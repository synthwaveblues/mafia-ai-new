interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
}

export function Badge({ children, color = '#888', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${className}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  )
}
