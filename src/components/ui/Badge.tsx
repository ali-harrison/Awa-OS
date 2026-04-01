import { HTMLAttributes } from 'react'

type BadgeVariant =
  | 'default'
  | 'amber'
  | 'green'
  | 'red'
  | 'muted'
  // Project status
  | 'onboarding'
  | 'questionnaire_sent'
  | 'questionnaire_received'
  | 'proposal_sent'
  | 'contract_sent'
  | 'deposit_pending'
  | 'deposit_paid'
  | 'in_progress'
  | 'review'
  | 'complete'
  // Client status
  | 'lead'
  | 'prospect'
  | 'active'
  | 'completed'
  | 'paused'
  // Invoice status
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  // Client type
  | 'charity'
  | 'gym'
  | 'consultant'
  | 'ecom'
  | 'other'
  // Task status
  | 'todo'
  | 'done'
  // Calendar event type
  | 'deadline'
  | 'meeting'
  | 'milestone'
  | 'reminder'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'text-[#F5F0E8] border-[#2A2A2A] bg-[#1A1A1A]',
  amber: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  green: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  red: 'text-[#E05252] border-[#E0525233] bg-[#E0525211]',
  muted: 'text-[#8A8580] border-[#2A2A2A] bg-transparent',
  // project statuses
  onboarding: 'text-[#8A8580] border-[#2A2A2A] bg-[#111111]',
  questionnaire_sent: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  questionnaire_received: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  proposal_sent: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  contract_sent: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  deposit_pending: 'text-[#E05252] border-[#E0525233] bg-[#E0525211]',
  deposit_paid: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  in_progress: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  review: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  complete: 'text-[#F5F0E8] border-[#F5F0E833] bg-[#F5F0E811]',
  // client statuses
  lead: 'text-[#8A8580] border-[#2A2A2A] bg-[#111111]',
  prospect: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  active: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  completed: 'text-[#F5F0E8] border-[#F5F0E833] bg-[#F5F0E811]',
  paused: 'text-[#8A8580] border-[#2A2A2A] bg-[#111111]',
  // invoice statuses
  draft: 'text-[#8A8580] border-[#2A2A2A] bg-[#111111]',
  sent: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  paid: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  overdue: 'text-[#E05252] border-[#E0525233] bg-[#E0525211]',
  // client types
  charity: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  gym: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  consultant: 'text-[#F5F0E8] border-[#F5F0E833] bg-[#F5F0E811]',
  ecom: 'text-[#8A8580] border-[#2A2A2A] bg-[#1A1A1A]',
  other: 'text-[#555050] border-[#2A2A2A] bg-transparent',
  // task status
  todo: 'text-[#555050] border-[#2A2A2A] bg-transparent',
  done: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  // calendar event type
  deadline: 'text-[#C9963A] border-[#C9963A33] bg-[#C9963A11]',
  meeting: 'text-[#F5F0E8] border-[#F5F0E833] bg-[#F5F0E811]',
  milestone: 'text-[#4CAF7D] border-[#4CAF7D33] bg-[#4CAF7D11]',
  reminder: 'text-[#8A8580] border-[#2A2A2A] bg-transparent',
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5',
        'text-xs font-mono font-medium tracking-wide uppercase',
        'border',
        'transition-colors duration-150',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

/** Dot indicator — small coloured circle */
export function StatusDot({ variant = 'default' }: { variant?: BadgeVariant }) {
  const dotColors: Partial<Record<BadgeVariant, string>> = {
    green: 'bg-[#4CAF7D]',
    amber: 'bg-[#C9963A]',
    red: 'bg-[#E05252]',
    muted: 'bg-[#555050]',
    in_progress: 'bg-[#4CAF7D]',
    active: 'bg-[#4CAF7D]',
    paid: 'bg-[#4CAF7D]',
    overdue: 'bg-[#E05252]',
    deposit_pending: 'bg-[#E05252]',
  }
  const color = dotColors[variant] ?? 'bg-[#555050]'
  return <span className={`inline-block w-1.5 h-1.5 ${color} flex-shrink-0`} />
}
