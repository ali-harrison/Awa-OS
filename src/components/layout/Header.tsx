import Link from 'next/link'
import { HTMLAttributes } from 'react'

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function Header({ title, subtitle, actions, backHref, backLabel, className = '', ...props }: HeaderProps) {
  return (
    <div
      className={[
        'flex items-center justify-between',
        'px-6 py-4',
        'border-b border-[#1A1A1A]',
        'bg-[#0A0A0A]',
        className,
      ].join(' ')}
      {...props}
    >
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="text-[#555050] font-mono text-[10px] uppercase tracking-widest hover:text-[#F5F0E8] transition-colors duration-150 mb-1 inline-block"
          >
            ← {backLabel ?? 'Back'}
          </Link>
        )}
        <h1 className="text-[#F5F0E8] font-mono font-semibold text-base tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#555050] font-mono text-xs mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
