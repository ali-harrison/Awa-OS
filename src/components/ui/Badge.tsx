import { HTMLAttributes } from 'react'

type Tone = 'neutral' | 'amber' | 'green' | 'red' | 'blue' | 'bone'

const TONES: Record<Tone, string> = {
  neutral: 'bg-bone/[0.06] text-muted',
  amber: 'bg-amber/12 text-amber',
  green: 'bg-pounamu/12 text-pounamu',
  red: 'bg-coral/12 text-coral',
  blue: 'bg-water/12 text-water',
  bone: 'bg-bone/12 text-bone',
}

const VARIANT_TONES = {
  default: 'neutral',
  muted: 'neutral',
  amber: 'amber',
  green: 'green',
  red: 'red',
  blue: 'blue',
  // Project stages: amber is waiting on someone, green is moving, blue is with the client
  onboarding: 'neutral',
  questionnaire_sent: 'amber',
  questionnaire_received: 'blue',
  proposal_sent: 'amber',
  contract_sent: 'amber',
  deposit_pending: 'amber',
  deposit_paid: 'green',
  in_progress: 'green',
  review: 'blue',
  complete: 'bone',
  // Client status
  lead: 'neutral',
  prospect: 'amber',
  active: 'green',
  completed: 'bone',
  paused: 'neutral',
  // Invoice status
  draft: 'neutral',
  sent: 'amber',
  paid: 'green',
  overdue: 'red',
  // Client type
  charity: 'green',
  gym: 'amber',
  consultant: 'blue',
  ecom: 'bone',
  other: 'neutral',
  // Task status
  todo: 'neutral',
  done: 'green',
  // Calendar event type
  deadline: 'amber',
  meeting: 'blue',
  milestone: 'green',
  reminder: 'neutral',
} as const satisfies Record<string, Tone>

export type BadgeVariant = keyof typeof VARIANT_TONES

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  /** Leading status dot. Off for plain tags such as a client type. */
  dot?: boolean
}

export function Badge({ variant = 'default', dot = false, className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5',
        'text-xs font-medium capitalize',
        TONES[VARIANT_TONES[variant]],
        className,
      ].join(' ')}
      {...props}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
