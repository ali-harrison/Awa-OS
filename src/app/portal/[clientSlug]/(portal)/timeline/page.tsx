import { createServiceClient } from '@/lib/supabase/server'
import { getLatestProject, requirePortalClient } from '@/lib/portal/auth'
import { formatDate, nzDate } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/Card'
import type { CalendarEvent, CalendarEventType } from '@/types'

/** One stop on the vertical river. Upcoming stops are lit; past ones have gone downstream. */
function Stop({ event, past }: { event: CalendarEvent; past?: boolean }) {
  return (
    <li className="relative flex gap-5 pb-7 pl-7 last:pb-0">
      <span
        aria-hidden
        className={`absolute top-1.5 left-0 size-3 rounded-full ${
          past ? 'bg-line-strong' : 'bg-amber shadow-[0_0_12px_2px_color-mix(in_srgb,var(--color-amber)_55%,transparent)]'
        }`}
      />
      <div className="w-16 shrink-0">
        <p className={`font-mono text-sm ${past ? 'text-dim' : 'text-amber'}`}>{formatDate(event.start_at)}</p>
        <p className="font-mono text-[11px] text-dim">{nzDate(event.start_at).slice(0, 4)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-[15px] ${past ? 'text-dim' : 'font-medium text-bone'}`}>{event.title}</p>
          {!past && <Badge variant={event.type as CalendarEventType}>{event.type}</Badge>}
        </div>
        {event.description && !past && <p className="mt-0.5 text-[13px] text-dim">{event.description}</p>}
      </div>
    </li>
  )
}

export default async function PortalTimelinePage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await requirePortalClient(clientSlug)
  const project = await getLatestProject(client.id)

  const { data: events } = project
    ? await createServiceClient()
        .from('calendar_events')
        .select('*')
        .eq('project_id', project.id)
        .eq('visible_to_client', true)
        .order('start_at')
    : { data: [] }

  const now = new Date()
  const all = (events ?? []) as CalendarEvent[]
  const upcoming = all.filter((e) => new Date(e.start_at) >= now)
  const past = all.filter((e) => new Date(e.start_at) < now).reverse()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[36px] leading-tight text-bone">Timeline</h1>
        <p className="mt-1 text-muted">Key dates and milestones for your project</p>
      </div>

      {all.length === 0 ? (
        <EmptyState title="No milestones yet" />
      ) : (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <section>
              <p className="eyebrow mb-4">Upcoming</p>
              <ol className="relative before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-0.5 before:bg-gradient-to-b before:from-amber before:to-water/40">
                {upcoming.map((event) => <Stop key={event.id} event={event} />)}
              </ol>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <p className="eyebrow mb-4">Past</p>
              <ol className="relative before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-0.5 before:bg-line">
                {past.map((event) => <Stop key={event.id} event={event} past />)}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
