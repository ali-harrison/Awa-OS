import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HTMLAttributes } from 'react'

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function Header({ title, subtitle, actions, backHref, backLabel, className = '', ...props }: HeaderProps) {
  return (
    <div
      className={['flex flex-wrap items-end justify-between gap-3 px-5 pt-6 pb-4 md:px-8 md:pt-8', className].join(' ')}
      {...props}
    >
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-dim transition-colors duration-150 hover:text-bone"
          >
            <ArrowLeft size={14} />
            {backLabel ?? 'Back'}
          </Link>
        )}
        <h1 className="truncate font-display text-[32px] leading-tight text-bone">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
