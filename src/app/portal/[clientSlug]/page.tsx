import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import { NEXT_ACTIONS } from '@/types'
import type { ProjectStatus } from '@/types'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  onboarding: 'Getting started',
  questionnaire_sent: 'Questionnaire sent',
  questionnaire_received: 'Questionnaire received',
  proposal_sent: 'Proposal sent — awaiting approval',
  contract_sent: 'Contract sent — awaiting signature',
  deposit_pending: 'Deposit invoice sent',
  deposit_paid: 'Deposit received — project starting',
  in_progress: 'In progress',
  review: 'In review',
  complete: 'Complete',
}

const PIPELINE_ORDER: ProjectStatus[] = [
  'onboarding', 'questionnaire_sent', 'questionnaire_received',
  'proposal_sent', 'contract_sent', 'deposit_pending',
  'deposit_paid', 'in_progress', 'review', 'complete',
]

export default async function PortalOverviewPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const cookieStore = await cookies()
  const raw = cookieStore.get(PORTAL_COOKIE)?.value
  if (!raw) notFound()

  let session: { clientId: string }
  try { session = JSON.parse(raw) } catch { notFound() }

  const supabase = await createServiceClient()
  const [{ data: client }, { data: projects }] = await Promise.all([
    supabase.from('clients').select('id, name, company').eq('id', session.clientId).single(),
    supabase
      .from('projects')
      .select('id, name, status, estimated_completion')
      .eq('client_id', session.clientId)
      .order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  const activeProject = projects?.[0]

  const tasksResult = activeProject
    ? await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', activeProject.id)
        .eq('visible_to_client', true)
        .neq('status', 'done')
    : { data: [] }

  const eventsResult = activeProject
    ? await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', activeProject.id)
        .eq('visible_to_client', true)
        .gte('start_at', new Date().toISOString())
        .order('start_at')
        .limit(5)
    : { data: [] }

  const currentStep = activeProject
    ? PIPELINE_ORDER.indexOf(activeProject.status as ProjectStatus)
    : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h1 className="text-[#F5F0E8] font-mono text-xl font-semibold mb-1">
          Kia ora, {client.name.split(' ')[0]}
        </h1>
        <p className="text-[#555050] font-mono text-sm">
          {client.company ? `${client.company} — ` : ''}project portal
        </p>
      </div>

      {activeProject ? (
        <>
          {/* Project status */}
          <div className="border border-[#1A1A1A]">
            <div className="px-4 py-3 border-b border-[#1A1A1A] bg-[#111111]">
              <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">{activeProject.name}</p>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <Badge variant={activeProject.status as ProjectStatus}>
                  {STATUS_LABELS[activeProject.status as ProjectStatus]}
                </Badge>
                {activeProject.estimated_completion && (
                  <span className="text-[#555050] font-mono text-xs">
                    Est. completion:{' '}
                    {new Date(activeProject.estimated_completion).toLocaleDateString('en-NZ', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex gap-0.5">
                {PIPELINE_ORDER.map((_, i) => (
                  <div
                    key={i}
                    className={[
                      'h-1 flex-1 transition-colors duration-300',
                      i <= currentStep ? 'bg-[#4CAF7D]' : 'bg-[#1A1A1A]',
                    ].join(' ')}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#555050] font-mono text-[9px]">Start</span>
                <span className="text-[#555050] font-mono text-[9px]">{currentStep + 1} / {PIPELINE_ORDER.length}</span>
                <span className="text-[#555050] font-mono text-[9px]">Complete</span>
              </div>
            </div>
          </div>

          {/* Visible tasks */}
          {(tasksResult.data?.length ?? 0) > 0 && (
            <div className="border border-[#1A1A1A]">
              <div className="px-4 py-3 border-b border-[#1A1A1A] bg-[#111111]">
                <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Pending items</p>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {tasksResult.data?.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#C9963A] flex-shrink-0" />
                    <p className="text-[#F5F0E8] font-mono text-sm">{t.title}</p>
                    {t.due_date && (
                      <span className="text-[#555050] font-mono text-xs ml-auto">
                        {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming events */}
          {(eventsResult.data?.length ?? 0) > 0 && (
            <div className="border border-[#1A1A1A]">
              <div className="px-4 py-3 border-b border-[#1A1A1A] bg-[#111111]">
                <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Upcoming</p>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {eventsResult.data?.map((ev) => (
                  <div key={ev.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-[#555050] font-mono text-xs w-20 flex-shrink-0">
                      {new Date(ev.start_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                    </span>
                    <p className="text-[#F5F0E8] font-mono text-sm">{ev.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="border border-[#1A1A1A] px-6 py-10 text-center">
          <p className="text-[#555050] font-mono text-sm">No active projects yet.</p>
        </div>
      )}

      {/* Contact card */}
      <div className="border border-[#1A1A1A] px-4 py-4">
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-3">Contact</p>
        <p className="text-[#F5F0E8] font-mono text-sm mb-1">Ali — Te Wairama Digital</p>
        <div className="flex gap-4">
          <a href="mailto:ali@tewairama.digital" className="text-[#8A8580] font-mono text-xs hover:text-[#F5F0E8] transition-colors duration-150">
            ali@tewairama.digital
          </a>
          <a href="https://wa.me/6421000000" className="text-[#8A8580] font-mono text-xs hover:text-[#F5F0E8] transition-colors duration-150">
            WhatsApp →
          </a>
        </div>
      </div>
    </div>
  )
}
