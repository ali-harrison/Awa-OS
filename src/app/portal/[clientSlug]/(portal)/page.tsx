import { Mail, MessageCircle } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePortalClient } from '@/lib/portal/auth'
import { formatDate, formatNZD } from '@/lib/format'
import { displayStatus } from '@/lib/invoices'
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

  const card = { background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' } as const

  return (
    <div className="flex flex-col gap-6">

      {/* Greeting */}
      <div className="mb-2">
        <h1 className="text-[#F5F0E8] font-mono text-4xl font-normal mb-2">
          Kia ora, {client.name.split(' ')[0]}
        </h1>
        <p className="text-[#555050] font-mono text-sm">
          {client.company ? `${client.company} — ` : ''}project portal
        </p>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1.6fr] gap-3">

        {/* Status — the long labels need the room */}
        <div className="col-span-2 md:col-span-1 min-w-0" style={{ ...card, padding: '20px 24px' }}>
          <p style={{ margin: '0 0 10px', fontFamily: 'monospace', fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status</p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#f0ece3' }}>
            {activeProject ? STATUS_LABELS[activeProject.status as ProjectStatus] : 'No project'}
          </p>
        </div>

        {/* Invoices */}
        <div className="min-w-0" style={{ ...card, padding: '20px 24px' }}>
          <p style={{ margin: '0 0 10px', fontFamily: 'monospace', fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Invoices</p>
          <p style={{ margin: '0 0 4px', fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#f0ece3' }}>
            {invoiceCount}
          </p>
          {outstandingTotal > 0 ? (
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: '#C9963A' }}>
              {formatNZD(outstandingTotal)} outstanding
            </p>
          ) : invoiceCount > 0 ? (
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: '#4CAF7D' }}>All paid</p>
          ) : null}
        </div>

        {/* Files */}
        <div className="min-w-0" style={{ ...card, padding: '20px 24px' }}>
          <p style={{ margin: '0 0 10px', fontFamily: 'monospace', fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Files</p>
          <p style={{ margin: '0 0 4px', fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#f0ece3' }}>
            {fileCount}
          </p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: '#555555' }}>
            {fileCount === 1 ? 'file uploaded' : 'files uploaded'}
          </p>
        </div>

        {/* Questionnaire */}
        <div className="col-span-2 md:col-span-1 min-w-0" style={{ ...card, padding: '20px 24px' }}>
          <p style={{ margin: '0 0 10px', fontFamily: 'monospace', fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Questionnaire</p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: questionnaireComplete ? '#4CAF7D' : '#C9963A' }}>
            {questionnaireComplete ? 'Complete ✓' : 'Awaiting'}
          </p>
        </div>

      </div>

      {activeProject ? (
        <>
          {/* Project card */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div className="px-6 py-6 border-b border-[#1f1f1f]">
              <p className="text-[#F5F0E8] font-mono text-2xl font-medium mb-1">{activeProject.name}</p>
              {activeProject.estimated_completion && (
                <p className="text-[#555050] font-mono text-sm">
                  Est. completion:{' '}
                  <span className="text-[#8A8580]">
                    {formatDate(activeProject.estimated_completion, 'long')}
                  </span>
                </p>
              )}
            </div>
            <div className="px-6 py-6">
              {/* Progress bar */}
              <div className="flex gap-0.5 mb-2">
                {PROJECT_STAGES.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 transition-colors duration-300"
                    style={{ height: 6, borderRadius: 2, background: i <= currentStep ? '#4CAF7D' : '#1A1A1A' }}
                  />
                ))}
              </div>
              <div className="flex justify-between">
                <span className="text-[#555050] font-mono text-xs">Start</span>
                <span className="text-[#4CAF7D] font-mono text-xs">{milestoneLabel}</span>
                <span className="text-[#555050] font-mono text-xs">Complete</span>
              </div>
            </div>
          </div>

          {/* Pending tasks */}
          {(tasksResult.data?.length ?? 0) > 0 && (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div className="px-6 py-3 border-b border-[#1f1f1f]">
                <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Pending items</p>
              </div>
              <div className="divide-y divide-[#1f1f1f]">
                {tasksResult.data?.map((t) => (
                  <div key={t.id} className="px-6 py-3 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#C9963A] flex-shrink-0 rounded-full" />
                    <p className="text-[#F5F0E8] font-mono text-sm">{t.title}</p>
                    {t.due_date && (
                      <span className="text-[#555050] font-mono text-xs ml-auto">
                        {formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming events */}
          {(eventsResult.data?.length ?? 0) > 0 && (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div className="px-6 py-3 border-b border-[#1f1f1f]">
                <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Upcoming</p>
              </div>
              <div className="divide-y divide-[#1f1f1f]">
                {eventsResult.data?.map((ev) => (
                  <div key={ev.id} className="px-6 py-3 flex items-center gap-4">
                    <span className="text-[#555050] font-mono text-xs w-20 flex-shrink-0">
                      {formatDate(ev.start_at)}
                    </span>
                    <p className="text-[#F5F0E8] font-mono text-sm">{ev.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <p className="text-[#555050] font-mono text-sm">No active projects yet.</p>
        </div>
      )}

      {/* Contact card */}
      <div style={{ ...card, padding: '24px' }}>
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-4">Your project manager</p>
        <p className="text-[#F5F0E8] font-mono text-sm font-semibold mb-4">Ali Harrison — Te Wairama Digital</p>
        <div className="flex flex-col gap-2">
          <a
            href="mailto:ali@tewairama.digital"
            className="flex items-center gap-2 text-[#8A8580] hover:text-[#F5F0E8] font-mono text-sm transition-colors duration-150"
          >
            <Mail size={14} className="flex-shrink-0" />
            ali@tewairama.digital
          </a>
          {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-sm transition-colors duration-150"
              style={{ color: '#C9963A' }}
            >
              <MessageCircle size={14} className="flex-shrink-0" />
              WhatsApp →
            </a>
          )}
        </div>
      </div>

    </div>
  )
}
