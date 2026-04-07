import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import { Calendar } from 'lucide-react'
import type { CalendarEventType } from '@/types'

const card = {
  background: '#0f0f0f',
  border: '1px solid #1f1f1f',
  borderRadius: 6,
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
} as const

const TYPE_STYLE: Record<CalendarEventType, { color: string; bg: string; border: string }> = {
  deadline: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  milestone: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  meeting:   { color: '#f0ece3', bg: 'rgba(240,236,227,0.06)', border: 'rgba(240,236,227,0.12)' },
  reminder:  { color: '#555555', bg: 'rgba(85,85,85,0.08)',    border: 'rgba(85,85,85,0.2)' },
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
        <h1 className="font-mono text-lg font-semibold mb-1" style={{ color: '#f0ece3' }}>Timeline</h1>
        <p className="font-mono text-sm" style={{ color: '#555555' }}>Key dates and milestones for your project</p>
      </div>

      {(events?.length ?? 0) === 0 ? (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <Calendar size={32} style={{ color: '#2a2a2a', margin: '0 auto 12px' }} />
          <p className="font-mono text-sm" style={{ color: '#555555' }}>No milestones yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <div>
              <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.08em', color: '#555555', marginBottom: 12 }}>Upcoming</p>
              <div style={{ ...card, overflow: 'hidden' }}>
                {upcoming.map((ev, i) => {
                  const st = TYPE_STYLE[ev.type as CalendarEventType] ?? TYPE_STYLE.reminder
                  return (
                    <div
                      key={ev.id}
                      className="flex items-stretch gap-0"
                      style={{ borderBottom: i < upcoming.length - 1 ? '1px solid #1f1f1f' : 'none' }}
                    >
                      <div style={{ width: 4, background: '#f59e0b', borderRadius: '0 2px 2px 0', flexShrink: 0 }} />
                      <div className="flex gap-4 px-5 py-4 flex-1 min-w-0">
                        <div style={{ width: 80, flexShrink: 0 }}>
                          <p className="font-mono text-sm" style={{ color: '#f0ece3' }}>
                            {new Date(ev.start_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="font-mono" style={{ fontSize: 10, color: '#555555' }}>
                            {new Date(ev.start_at).getFullYear()}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-mono text-sm font-medium" style={{ color: '#f0ece3' }}>{ev.title}</p>
                            <span
                              className="font-mono uppercase"
                              style={{ fontSize: 10, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 3, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
                            >
                              {ev.type}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="font-mono text-xs" style={{ color: '#555555' }}>{ev.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.08em', color: '#555555', marginBottom: 12 }}>Past</p>
              <div style={{ ...card, overflow: 'hidden', opacity: 0.5 }}>
                {[...past].reverse().map((ev, i) => (
                  <div
                    key={ev.id}
                    className="flex items-stretch gap-0"
                    style={{ borderBottom: i < past.length - 1 ? '1px solid #1f1f1f' : 'none' }}
                  >
                    <div style={{ width: 4, background: '#2a2a2a', borderRadius: '0 2px 2px 0', flexShrink: 0 }} />
                    <div className="flex gap-4 px-5 py-4 flex-1 min-w-0">
                      <div style={{ width: 80, flexShrink: 0 }}>
                        <p className="font-mono text-sm" style={{ color: '#555555' }}>
                          {new Date(ev.start_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm line-through" style={{ color: '#555555' }}>{ev.title}</p>
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
