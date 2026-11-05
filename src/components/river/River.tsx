import { useId } from 'react'
import {
  BODY_PATH,
  CENTRE_PATH,
  LOWER_FLOW_PATH,
  RIVER_HEIGHT,
  RIVER_WIDTH,
  UPPER_FLOW_PATH,
} from './geometry'

/**
 * The flowing river. `lit` is how far along the water carries light (0–1); beyond that it
 * stays dark, which is how a client's journey shows what's still ahead.
 * It stretches to fill its box, so place markers over it with `pointOnRiver`.
 */
export function River({ lit = 1, className = '' }: { lit?: number; className?: string }) {
  const id = useId()
  const litWidth = lit * RIVER_WIDTH

  return (
    <svg
      viewBox={`0 0 ${RIVER_WIDTH} ${RIVER_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
      className={`absolute inset-0 h-full w-full overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={`${id}-water`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--color-amber)" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="var(--color-amber)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-water)" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id={`${id}-glow`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--color-amber)" />
          <stop offset="0.72" stopColor="var(--color-amber)" />
          <stop offset="1" stopColor="var(--color-water)" />
        </linearGradient>
        <clipPath id={`${id}-lit`}>
          <rect x="0" y="-40" width={litWidth} height={RIVER_HEIGHT + 80} />
        </clipPath>
      </defs>

      {/* Unlit water */}
      <path d={BODY_PATH} fill="var(--color-raised)" />
      <path d={CENTRE_PATH} fill="none" stroke="var(--color-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />

      {/* Lit water, with light moving downstream */}
      <g clipPath={`url(#${id}-lit)`}>
        <path d={BODY_PATH} fill={`url(#${id}-water)`} />
        <path d={CENTRE_PATH} fill="none" stroke={`url(#${id}-glow)`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path d={UPPER_FLOW_PATH} className="river-flow-slow" stroke="var(--color-bone)" strokeOpacity="0.28" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={LOWER_FLOW_PATH} className="river-flow-slow" stroke="var(--color-bone)" strokeOpacity="0.16" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={CENTRE_PATH} className="river-flow" stroke="var(--color-bone)" strokeOpacity="0.9" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  )
}
