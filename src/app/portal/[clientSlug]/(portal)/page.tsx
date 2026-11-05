import { Mail, MessageCircle } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePortalClient } from '@/lib/portal/auth'
import { formatDate, formatNZD } from '@/lib/format'
import { displayStatus } from '@/lib/invoices'
import { Card, CardHeader, CardTitle, Stat } from '@/components/ui/Card'
import { RiverJourney } from '@/components/river/RiverJourney'
import { PROJECT_STAGES, type InvoiceStatus, type ProjectStatus } from '@/types'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  onboarding: 'Getting started',
  questionnaire_sent: 'Questionnaire sent',
  questionnaire_received: 'Questionnaire received',
  proposal_sent: 'Proposal sent',
  contract_sent: 'Contract sent',
  deposit_pending: 'Deposit pending',
  deposit_paid: 'Deposit received',
  in_progress: 'In progress',
  review: 'In review',
  complete: 'Complete',
}

export default async function PortalOverviewPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await requirePortalClient(clientSlug)
  const supabase = createServiceClient()

  const [
    { data: projects },
    { data: invoices },
    { data: files },
  ] = await Promise.all([
    supabase.from('projects').select('id, name, status, estimated_completion').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, amount, status, due_date').eq('client_id', client.id).neq('status', 'draft'),
    supabase.from('files').select('id').eq('client_id', client.id),
  ])

  const activeProject = projects?.[0]

  const [tasksResult, eventsResult, questionnaireResult] = await Promise.all([
    activeProject
      ? supabase.from('tasks').select('*').eq('project_id', activeProject.id).eq('visible_to_client', true).neq('status', 'done')
      : Promise.resolve({ data: [] }),
    activeProject
      ? supabase.from('calendar_events').select('*').eq('project_id', activeProject.id).eq('visible_to_client', true).gte('start_at', new Date().toISOString()).order('start_at').limit(5)
      : Promise.resolve({ data: [] }),
    activeProject
      ? supabase.from('questionnaire_responses').select('id, completed').eq('project_id', activeProject.id).order('submitted_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const currentStep = activeProject ? PROJECT_STAGES.indexOf(activeProject.status as ProjectStatus) : 0
  const totalSteps = PROJECT_STAGES.length

  const unpaidInvoices = invoices?.filter((i) => ['sent', 'overdue'].includes(displayStatus({ status: i.status as InvoiceStatus, due_date: i.due_date }))) ?? []
  const outstandingTotal = unpaidInvoices.reduce((s, i) => s + i.amount, 0)
  const questionnaireComplete = questionnaireResult.data?.completed === true
  const fileCount = files?.length ?? 0
  const invoiceCount = invoices?.length ?? 0

  const milestoneLabel = currentStep + 1 >= totalSteps
    ? 'All milestones complete'
    : `Milestone ${currentStep + 1} of ${totalSteps}`

  const hasTasks = (tasksResult.data?.length ?? 0) > 0
  const hasEvents = (eventsResult.data?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-4">

      {/* Greeting */}
      <div className="mb-3">
        <p className="eyebrow mb-2">{client.company ? `${client.company} · ` : ''}Project portal</p>
        <h1 className="font-display text-[44px] leading-[1.05] text-bone md:text-[56px]">
          Kia ora, {client.name.split(' ')[0]}.
        </h1>
        {activeProject && (
          <p className="mt-3 text-muted">
            <span className="text-bone">{activeProject.name}</span> —{' '}
            <span className="text-amber">{STATUS_LABELS[activeProject.status as ProjectStatus].toLowerCase()}</span>
          </p>
        )}
      </div>

      {activeProject ? (
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 px-6 pt-5">
            <h2 className="font-display text-2xl text-bone">Your project&apos;s journey</h2>
            <p className="font-mono text-xs text-amber">{milestoneLabel}</p>
          </div>
          <div className="px-6 pt-4 pb-5">
            <RiverJourney status={activeProject.status as ProjectStatus} />
          </div>
          {activeProject.estimated_completion && (
            <p className="border-t border-line px-6 py-3 text-[13px] text-dim">
              Estimated completion{' '}
              <span className="text-muted">{formatDate(activeProject.estimated_completion, 'long')}</span>
            </p>
          )}
        </Card>
      ) : (
        <Card className="py-10 text-center">
          <p className="font-display text-xl text-muted">No active projects yet.</p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Invoices"
          value={String(invoiceCount)}
          tone="text-bone"
          note={
            outstandingTotal > 0 ? (
              <span className="text-amber">{formatNZD(outstandingTotal)} outstanding</span>
            ) : invoiceCount > 0 ? (
              <span className="text-pounamu">All paid</span>
            ) : (
              'Nothing to pay'
            )
          }
        />
        <Stat
          label="Files"
          value={String(fileCount)}
          note={fileCount === 1 ? 'file uploaded' : 'files uploaded'}
        />
        <Stat
          label="Questionnaire"
          value={questionnaireComplete ? 'Complete' : 'Awaiting'}
          tone={questionnaireComplete ? 'text-pounamu' : 'text-amber'}
          note={questionnaireComplete ? 'Thanks for that' : 'A few questions from us'}
        />
      </div>

      {(hasTasks || hasEvents) && (
        <div className={`grid items-start gap-4 ${hasTasks && hasEvents ? 'md:grid-cols-2' : ''}`}>
          {hasTasks && (
            <Card padding="none">
              <CardHeader>
                <CardTitle>Waiting on you</CardTitle>
              </CardHeader>
              <div className="divide-y divide-line">
                {tasksResult.data?.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-amber" />
                    <p className="min-w-0 flex-1 text-sm text-bone">{t.title}</p>
                    {t.due_date && <span className="font-mono text-xs text-dim">{formatDate(t.due_date)}</span>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {hasEvents && (
            <Card padding="none">
              <CardHeader>
                <CardTitle>Coming up</CardTitle>
              </CardHeader>
              <div className="divide-y divide-line">
                {eventsResult.data?.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-14 shrink-0 font-mono text-xs text-amber">{formatDate(ev.start_at)}</span>
                    <p className="min-w-0 text-sm text-bone">{ev.title}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Contact */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5">Your project manager</p>
          <p className="font-display text-xl text-bone">Ali Harrison</p>
          <p className="text-[13px] text-dim">Te Wairama Digital</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href="mailto:ali@tewairama.digital"
            className="flex items-center gap-2 text-sm text-muted transition-colors duration-150 hover:text-bone"
          >
            <Mail size={15} className="shrink-0" />
            ali@tewairama.digital
          </a>
          {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-amber transition-colors duration-150 hover:text-bone"
            >
              <MessageCircle size={15} className="shrink-0" />
              WhatsApp
            </a>
          )}
        </div>
      </Card>
    </div>
  )
}
