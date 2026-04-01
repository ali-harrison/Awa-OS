import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import type { CalendarEventType } from '@/types'

const eventTypeVariant: Record<CalendarEventType, 'amber' | 'green' | 'muted' | 'default'> = {
  deadline: 'amber',
  meeting: 'default',
  milestone: 'green',
  reminder: 'muted',
}

export default async function PortalTimelinePage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  await params
  const cookieStore = await cookies()
  const raw = cookieStore.get(PORTAL_COOKIE)?.value
  if (!raw) notFound()

  let session: { clientId: string }
  try { session = JSON.parse(raw) } catch { notFound() }

  const supabase = await createServiceClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', session.clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: events } = project
    ? await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', project.id)
        .eq('visible_to_client', true)
        .order('start_at')
    : { data: [] }

  const now = new Date()
  const upcoming = events?.filter((e) => new Date(e.start_at) >= now) ?? []
  const past = events?.filter((e) => new Date(e.start_at) < now) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#F5F0E8] font-mono text-lg font-semibold mb-1">Timeline</h1>
        <p className="text-[#555050] font-mono text-sm">Key dates and milestones for your project</p>
      </div>

      {(events?.length ?? 0) === 0 ? (
        <div className="border border-[#1A1A1A] px-6 py-10 text-center">
          <p className="text-[#555050] font-mono text-sm">No events scheduled yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <div>
              <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-3">Upcoming</p>
              <div className="flex flex-col gap-2">
                {upcoming.map((ev) => (
                  <div key={ev.id} className="flex gap-4 border-l-2 border-[#4CAF7D33] pl-4 py-1">
                    <div className="w-20 flex-shrink-0">
                      <p className="text-[#F5F0E8] font-mono text-sm">
                        {new Date(ev.start_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-[#555050] font-mono text-[10px]">
                        {new Date(ev.start_at).getFullYear()}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[#F5F0E8] font-mono text-sm">{ev.title}</p>
                        <Badge variant={eventTypeVariant[ev.type as CalendarEventType]}>{ev.type}</Badge>
                      </div>
                      {ev.description && (
                        <p className="text-[#8A8580] font-mono text-xs">{ev.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-3">Past</p>
              <div className="flex flex-col gap-2">
                {[...past].reverse().map((ev) => (
                  <div key={ev.id} className="flex gap-4 border-l-2 border-[#1A1A1A] pl-4 py-1 opacity-60">
                    <div className="w-20 flex-shrink-0">
                      <p className="text-[#8A8580] font-mono text-sm">
                        {new Date(ev.start_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[#8A8580] font-mono text-sm line-through">{ev.title}</p>
                        <Badge variant="muted">{ev.type}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
