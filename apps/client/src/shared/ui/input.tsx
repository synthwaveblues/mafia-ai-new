import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`px-4 py-3 rounded-lg border border-[#333] bg-[#1a1a2e] text-white text-base outline-none focus:border-indigo-500 transition-colors ${className}`}
      {...props}
    />
  )
}
