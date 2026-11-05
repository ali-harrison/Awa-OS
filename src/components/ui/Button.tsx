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
  primary: 'bg-bone text-ink hover:bg-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset]',
  secondary: 'bg-bone/[0.06] text-bone hover:bg-bone/[0.11]',
  ghost: 'text-muted hover:text-bone hover:bg-bone/[0.06]',
  danger: 'bg-coral/12 text-coral hover:bg-coral hover:text-ink',
  amber: 'bg-amber text-ink hover:brightness-110',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg',
  md: 'h-10 px-4 text-sm rounded-[10px]',
  lg: 'h-11 px-5 text-[15px] rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
        'transition-all duration-150 active:scale-[0.98] cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
