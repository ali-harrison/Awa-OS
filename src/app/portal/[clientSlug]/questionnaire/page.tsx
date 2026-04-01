import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import { QuestionnaireForm } from './QuestionnaireForm'
import type { QuestionnaireTemplate, QuestionnaireResponse } from '@/types'

export default async function QuestionnairePage({
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

  // Get client type
  const { data: client } = await supabase
    .from('clients')
    .select('type')
    .eq('id', session.clientId)
    .single()

  if (!client) notFound()

  // Get active project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('client_id', session.clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-[#555050] font-mono text-sm">No active project found.</p>
      </div>
    )
  }

  // Get matching template (client type first, fall back to base)
  const { data: templates } = await supabase
    .from('questionnaire_templates')
    .select('*')
    .in('client_type', [client.type, 'base'])

  const template = templates?.find((t) => t.client_type === client.type)
    ?? templates?.find((t) => t.client_type === 'base')

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-[#555050] font-mono text-sm">No questionnaire template found.</p>
      </div>
    )
  }

  // Check if already completed
  const { data: existingResponse } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('project_id', project.id)
    .single()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#F5F0E8] font-mono text-lg font-semibold mb-1">Project questionnaire</h1>
        <p className="text-[#555050] font-mono text-sm">{project.name}</p>
      </div>
      <QuestionnaireForm
        template={template as QuestionnaireTemplate}
        projectId={project.id}
        existingResponse={existingResponse as QuestionnaireResponse | null}
      />
    </div>
  )
}
