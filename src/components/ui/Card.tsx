import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={['rounded-2xl border border-line bg-surface', paddingClasses[padding], className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['flex items-center justify-between gap-3 border-b border-line px-5 py-3.5', className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={['text-sm font-semibold text-bone', className].join(' ')} {...props}>
      {children}
    </h2>
  )
}

/** A headline number: the mono figure is the star, the label and note stay quiet. */
export function Stat({
  label,
  value,
  note,
  tone = 'text-bone',
}: {
  label: string
  value: string
  note?: React.ReactNode
  tone?: string
}) {
  return (
    <Card>
      <p className="eyebrow">{label}</p>
      <p className={`mt-3 font-mono text-[28px] leading-none font-medium tracking-tight ${tone}`}>{value}</p>
      {note && <p className="mt-2.5 text-[13px] text-dim">{note}</p>}
    </Card>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="font-display text-xl text-muted">{title}</p>
      {children}
    </div>
  )
}
