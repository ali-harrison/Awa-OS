import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Mail, MessageCircle } from 'lucide-react'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import type { ProjectStatus } from '@/types'

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

const STATUS_COLOURS: Record<ProjectStatus, string> = {
  onboarding: '#8A8580',
  questionnaire_sent: '#C9963A',
  questionnaire_received: '#C9963A',
  proposal_sent: '#C9963A',
  contract_sent: '#C9963A',
  deposit_pending: '#C9963A',
  deposit_paid: '#4CAF7D',
  in_progress: '#4CAF7D',
  review: '#C9963A',
  complete: '#4CAF7D',
}

const PIPELINE_ORDER: ProjectStatus[] = [
  'onboarding', 'questionnaire_sent', 'questionnaire_received',
  'proposal_sent', 'contract_sent', 'deposit_pending',
  'deposit_paid', 'in_progress', 'review', 'complete',
]

function formatNZD(cents: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 0 }).format(cents / 100)
}

export default async function PortalOverviewPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const cookieStore = await cookies()
  const raw = cookieStore.get(PORTAL_COOKIE)?.value

  // dev bypass — session may be missing in development
  let clientId: string | null = null
  if (raw) {
    try { clientId = JSON.parse(raw).clientId } catch { /* ignore */ }
  }

  const supabase = await createServiceClient()

  // In dev with no session, look up client by slug
  let resolvedClientId = clientId
  if (!resolvedClientId) {
    const { data: bySlug } = await supabase.from('clients').select('id').eq('slug', clientSlug).single()
    if (!bySlug) notFound()
    resolvedClientId = bySlug.id
  }

  const [
    { data: client },
    { data: projects },
    { data: invoices },
    { data: files },
  ] = await Promise.all([
    supabase.from('clients').select('id, name, company').eq('id', resolvedClientId).single(),
    supabase.from('projects').select('id, name, status, estimated_completion').eq('client_id', resolvedClientId).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, amount, status').eq('client_id', resolvedClientId).neq('status', 'draft'),
    supabase.from('files').select('id').eq('client_id', resolvedClientId),
  ])

  if (!client) notFound()

  const activeProject = projects?.[0]

  const [tasksResult, eventsResult, questionnaireResult] = await Promise.all([
    activeProject
      ? supabase.from('tasks').select('*').eq('project_id', activeProject.id).eq('visible_to_client', true).neq('status', 'done')
      : Promise.resolve({ data: [] }),
    activeProject
      ? supabase.from('calendar_events').select('*').eq('project_id', activeProject.id).eq('visible_to_client', true).gte('start_at', new Date().toISOString()).order('start_at').limit(5)
      : Promise.resolve({ data: [] }),
    activeProject
      ? supabase.from('questionnaire_responses').select('id, completed').eq('project_id', activeProject.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const currentStep = activeProject ? PIPELINE_ORDER.indexOf(activeProject.status as ProjectStatus) : 0
  const totalSteps = PIPELINE_ORDER.length

  const unpaidInvoices = invoices?.filter((i) => i.status === 'sent' || i.status === 'overdue') ?? []
  const outstandingTotal = unpaidInvoices.reduce((s, i) => s + i.amount, 0)
  const questionnaireComplete = questionnaireResult.data?.completed === true
  const fileCount = files?.length ?? 0
  const invoiceCount = invoices?.length ?? 0

  const milestoneLabel = currentStep + 1 >= totalSteps
    ? 'All milestones complete'
    : `Milestone ${currentStep + 1} of ${totalSteps}`

  return (
    <div className="flex flex-col gap-8">

      {/* Greeting */}
      <div>
        <h1 className="text-[#F5F0E8] font-mono text-3xl font-semibold mb-1">
          Kia ora, {client.name.split(' ')[0]}
        </h1>
        <p className="text-[#555050] font-mono text-sm">
          {client.company ? `${client.company} — ` : ''}project portal
        </p>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Status */}
        <div style={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: 6, padding: '20px 24px', boxShadow: '0 0 0 1px #1a1a1a' }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'monospace', fontSize: 10, color: '#555050', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: activeProject ? STATUS_COLOURS[activeProject.status as ProjectStatus] : '#555050' }}>
            {activeProject ? STATUS_LABELS[activeProject.status as ProjectStatus] : 'No project'}
          </p>
        </div>

        {/* Invoices */}
        <div style={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: 6, padding: '20px 24px', boxShadow: '0 0 0 1px #1a1a1a' }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'monospace', fontSize: 10, color: '#555050', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Invoices</p>
          <p style={{ margin: '0 0 4px', fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#f0ece3' }}>
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
        <div style={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: 6, padding: '20px 24px', boxShadow: '0 0 0 1px #1a1a1a' }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'monospace', fontSize: 10, color: '#555050', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Files</p>
          <p style={{ margin: '0 0 4px', fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#f0ece3' }}>
            {fileCount}
          </p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: '#555050' }}>
            {fileCount === 1 ? 'file uploaded' : 'files uploaded'}
          </p>
        </div>

        {/* Questionnaire */}
        <div style={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: 6, padding: '20px 24px', boxShadow: '0 0 0 1px #1a1a1a' }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'monospace', fontSize: 10, color: '#555050', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Questionnaire</p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: questionnaireComplete ? '#4CAF7D' : '#C9963A' }}>
            {questionnaireComplete ? 'Complete ✓' : 'Awaiting'}
          </p>
        </div>

      </div>

      {activeProject ? (
        <>
          {/* Project card */}
          <div className="border border-[#1A1A1A] rounded-md overflow-hidden">
            <div className="px-6 py-5 border-b border-[#1A1A1A] bg-[#111111]">
              <p className="text-[#F5F0E8] font-mono text-xl font-semibold mb-1">{activeProject.name}</p>
              {activeProject.estimated_completion && (
                <p className="text-[#555050] font-mono text-sm">
                  Est. completion:{' '}
                  <span className="text-[#8A8580]">
                    {new Date(activeProject.estimated_completion).toLocaleDateString('en-NZ', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </p>
              )}
            </div>
            <div className="px-6 py-5">
              {/* Progress bar */}
              <div className="flex gap-0.5 mb-2">
                {PIPELINE_ORDER.map((_, i) => (
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
            <div className="border border-[#1A1A1A] rounded-md overflow-hidden">
              <div className="px-6 py-3 border-b border-[#1A1A1A] bg-[#111111]">
                <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Pending items</p>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {tasksResult.data?.map((t) => (
                  <div key={t.id} className="px-6 py-3 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#C9963A] flex-shrink-0 rounded-full" />
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
            <div className="border border-[#1A1A1A] rounded-md overflow-hidden">
              <div className="px-6 py-3 border-b border-[#1A1A1A] bg-[#111111]">
                <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Upcoming</p>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {eventsResult.data?.map((ev) => (
                  <div key={ev.id} className="px-6 py-3 flex items-center gap-4">
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
        <div className="border border-[#1A1A1A] rounded-md px-6 py-10 text-center">
          <p className="text-[#555050] font-mono text-sm">No active projects yet.</p>
        </div>
      )}

      {/* Contact card */}
      <div className="border border-[#1A1A1A] rounded-md px-6 py-6">
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
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-mono text-sm transition-colors duration-150"
            style={{ color: '#C9963A' }}
          >
            <MessageCircle size={14} className="flex-shrink-0" />
            WhatsApp →
          </a>
        </div>
      </div>

    </div>
  )
}
