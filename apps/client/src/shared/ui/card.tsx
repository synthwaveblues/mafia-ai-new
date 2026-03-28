import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined'
  borderColor?: string
}

export function Card({ variant = 'default', borderColor, className = '', style, ...props }: CardProps) {
  const base = 'rounded-xl'
  const variantClass = variant === 'outlined'
    ? 'border-2 bg-[#1a1a2e]'
    : 'bg-[#1a1a2e]'

  return (
    <div
      className={`${base} ${variantClass} ${className}`}
      style={borderColor ? { borderColor, ...style } : style}
      {...props}
    />
  )
}
