import { createServiceClient } from '@/lib/supabase/server'
import { getLatestProject, requirePortalClient } from '@/lib/portal/auth'
import { QuestionnaireForm } from './QuestionnaireForm'
import type { QuestionnaireTemplate, QuestionnaireResponse } from '@/types'

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await requirePortalClient(clientSlug)
  const project = await getLatestProject(client.id)
  const supabase = createServiceClient()

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

  // Pick up a saved draft, or show the completed answers
  const { data: existingResponse } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('project_id', project.id)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#F5F0E8] font-mono text-lg font-semibold mb-1">Project questionnaire</h1>
        <p className="text-[#555050] font-mono text-sm">{project.name}</p>
      </div>
      <QuestionnaireForm
        template={template as QuestionnaireTemplate}
        projectId={project.id}
        clientSlug={clientSlug}
        existingResponse={existingResponse as QuestionnaireResponse | null}
      />
    </div>
  )
}
