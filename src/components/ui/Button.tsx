'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#F5F0E8] text-[#0A0A0A] hover:bg-[#E8E3DB] border border-[#F5F0E8] hover:border-[#E8E3DB]',
  secondary:
    'bg-transparent text-[#F5F0E8] border border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#1A1A1A]',
  ghost:
    'bg-transparent text-[#8A8580] border border-transparent hover:text-[#F5F0E8] hover:bg-[#111111]',
  danger:
    'bg-transparent text-[#E05252] border border-[#E05252] hover:bg-[#E05252] hover:text-[#0A0A0A]',
  amber:
    'bg-transparent text-[#C9963A] border border-[#C9963A] hover:bg-[#C9963A] hover:text-[#0A0A0A]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 h-7',
  md: 'text-sm px-4 py-2 h-9',
  lg: 'text-sm px-5 py-2.5 h-10',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2',
          'font-mono font-medium tracking-tight',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border border-current border-t-transparent animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
