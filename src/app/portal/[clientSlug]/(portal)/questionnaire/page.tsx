import { createServiceClient } from '@/lib/supabase/server'
import { getLatestProject, requirePortalClient } from '@/lib/portal/auth'
import { EmptyState } from '@/components/ui/Card'
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
      <EmptyState title="No active project found" />
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
      <EmptyState title="No questionnaire template found" />
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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[36px] leading-tight text-bone">Project questionnaire</h1>
        <p className="mt-1 text-muted">{project.name}</p>
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
