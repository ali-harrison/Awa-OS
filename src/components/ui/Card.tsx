import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: 1 | 2 | 3
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const surfaceClasses = {
  1: 'bg-[#111111]',
  2: 'bg-[#1A1A1A]',
  3: 'bg-[#2A2A2A]',
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  surface = 1,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        surfaceClasses[surface],
        paddingClasses[padding],
        'border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors duration-150',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div
      className={['flex items-center justify-between mb-4', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className = '', children, ...props }: CardTitleProps) {
  return (
    <h3
      className={[
        'text-[#F5F0E8] text-sm font-mono font-medium tracking-tight uppercase',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </h3>
  )
}
