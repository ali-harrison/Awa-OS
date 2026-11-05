import Link from 'next/link'
import { River } from './River'
import { pointOnRiver, stageT } from './geometry'
import { daysSince } from '@/lib/format'
import { PROJECT_STAGES, STAGE_LABELS, type ProjectStatus } from '@/types'

export interface RiverProject {
  id: string
  name: string
  status: ProjectStatus
  stage_updated_at: string
  clientName: string
  stale: boolean
}

const BEAD_SPACING = 0.016 // of the river's length, for projects sharing a stage

/** The whole pipeline as a river: each project is a bead at its stage, flowing to the sea. */
export function RiverMap({ projects }: { projects: RiverProject[] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="min-w-[860px]">
        <div className="relative h-[190px]">
          <div className="absolute inset-x-0 top-10 bottom-0">
            <River />

            {PROJECT_STAGES.map((stage, i) => {
              const { left, top } = pointOnRiver(stageT(i, PROJECT_STAGES.length))
              return (
                <span
                  key={stage}
                  aria-hidden
                  className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-1 ring-bone/40"
                  style={{ left: `${left}%`, top: `${top}%` }}
                />
              )
            })}

            {PROJECT_STAGES.flatMap((stage, i) => {
              const here = projects.filter((p) => p.status === stage)
              return here.map((project, k) => {
                const t = stageT(i, PROJECT_STAGES.length) + (k - (here.length - 1) / 2) * BEAD_SPACING
                const { left, top } = pointOnRiver(t)
                const days = daysSince(project.stage_updated_at)
                // Keep the tooltip on the map at either end of the river
                const tooltipAnchor =
                  i < 2 ? 'left-0' : i >= PROJECT_STAGES.length - 2 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    aria-label={`${project.name}, ${project.clientName}, ${STAGE_LABELS[stage]}`}
                    className={`river-bead group z-10 transition-transform duration-200 hover:scale-125 ${project.stale ? 'river-bead-stale' : ''}`}
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <span className={`pointer-events-none absolute bottom-[calc(100%+10px)] w-max max-w-60 ${tooltipAnchor} rounded-lg border border-line-strong bg-overlay px-3 py-2 text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100`}>
                      <span className="block text-[13px] font-medium text-bone">{project.name}</span>
                      <span className="block text-xs text-dim">
                        {project.clientName} · {days === 0 ? 'moved today' : `${days}d at this stage`}
                      </span>
                    </span>
                  </Link>
                )
              })
            })}
          </div>
        </div>

        <div className="relative mt-4 h-9">
          {PROJECT_STAGES.map((stage, i) => {
            const count = projects.filter((p) => p.status === stage).length
            const { left } = pointOnRiver(stageT(i, PROJECT_STAGES.length))
            return (
              <div key={stage} className="absolute w-24 -translate-x-1/2 text-center" style={{ left: `${left}%` }}>
                <p className={`text-xs ${count ? 'text-muted' : 'text-dim'}`}>{STAGE_LABELS[stage]}</p>
                <p className={`font-mono text-[11px] ${count ? 'text-amber' : 'text-transparent'}`}>{count}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
