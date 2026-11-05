import { River } from './River'
import { pointOnRiver, stageT } from './geometry'
import { PROJECT_STAGES, STAGE_LABELS, type ProjectStatus } from '@/types'

/** A client's view of the river: lit as far as they've come, with a bead marking "you are here". */
export function RiverJourney({
  status,
  height = 'h-[210px]',
  marker = 'You are here',
}: {
  status: ProjectStatus
  height?: string
  marker?: string
}) {
  const total = PROJECT_STAGES.length
  const current = PROJECT_STAGES.indexOf(status)
  const position = stageT(current, total)
  const bead = pointOnRiver(position)

  return (
    <>
      {/* Wide screens: the river itself */}
      <div className="hidden md:block">
        <div className={`relative ${height}`}>
          <River lit={position} />

          {PROJECT_STAGES.map((stage, i) => {
            const { left, top } = pointOnRiver(stageT(i, total))
            return (
              <span
                key={stage}
                aria-hidden
                className={`absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  i <= current ? 'bg-bone' : 'bg-ink ring-1 ring-dim'
                }`}
                style={{ left: `${left}%`, top: `${top}%` }}
              />
            )
          })}

          <span
            className="river-bead river-bead-pulse z-10 !size-4"
            style={{ left: `${bead.left}%`, top: `${bead.top}%` }}
          />
          <span
            className="absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+18px)] rounded-full bg-amber px-3 py-1 text-xs font-semibold whitespace-nowrap text-ink"
            style={{ left: `${Math.min(Math.max(bead.left, 6), 94)}%`, top: `${bead.top}%` }}
          >
            {marker}
          </span>
        </div>

        <div className="relative mt-3 h-5">
          {PROJECT_STAGES.map((stage, i) => (
            <span
              key={stage}
              className={`absolute w-24 -translate-x-1/2 text-center text-xs ${
                i === current ? 'font-semibold text-amber' : i < current ? 'text-muted' : 'text-dim'
              }`}
              style={{ left: `${pointOnRiver(stageT(i, total)).left}%` }}
            >
              {STAGE_LABELS[stage]}
            </span>
          ))}
        </div>
      </div>

      {/* Phones: the same journey, running down the screen */}
      <ol className="md:hidden">
        {PROJECT_STAGES.map((stage, i) => (
          <li key={stage} className="relative flex items-center gap-3.5 py-1.5 pl-1">
            {i < total - 1 && (
              <span
                aria-hidden
                className={`absolute top-1/2 left-[8px] h-full w-0.5 ${i < current ? 'bg-amber' : 'bg-line-strong'}`}
              />
            )}
            <span
              aria-hidden
              className={`relative z-10 size-2.5 shrink-0 rounded-full ${
                i === current
                  ? 'bg-amber shadow-[0_0_12px_3px_color-mix(in_srgb,var(--color-amber)_60%,transparent)]'
                  : i < current ? 'bg-amber/70' : 'bg-ink ring-1 ring-dim'
              }`}
            />
            <span className={`text-sm ${i === current ? 'font-semibold text-amber' : i < current ? 'text-muted' : 'text-dim'}`}>
              {STAGE_LABELS[stage]}
              {i === current && <span className="ml-2 text-xs font-normal text-bone">{marker}</span>}
            </span>
          </li>
        ))}
      </ol>
    </>
  )
}
