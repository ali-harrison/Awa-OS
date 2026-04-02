import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { ProjectDetailClient } from './ProjectDetailClient'
import type { Client, Project, Task, ProjectFile, CalendarEvent, QuestionnaireResponse } from '@/types'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: project },
    { data: tasks },
    { data: files },
    { data: events },
    { data: questionnaireResponse },
  ] = await Promise.all([
    supabase.from('projects').select('*, client:clients(*)').eq('id', id).single(),
    supabase.from('tasks').select('*').eq('project_id', id).order('created_at'),
    supabase.from('files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('calendar_events').select('*').eq('project_id', id).order('start_at'),
    supabase.from('questionnaire_responses').select('*, template:questionnaire_templates(questions)').eq('project_id', id).maybeSingle(),
  ])

  if (!project) notFound()

  const client = project.client as unknown as Client

  return (
    <>
      <Header
        title={project.name}
        subtitle={
          <Link href={`/clients/${client.id}`} className="hover:text-[#F5F0E8] transition-colors duration-150">
            {client.name}{client.company ? ` — ${client.company}` : ''}
          </Link> as unknown as string
        }
        backHref="/projects"
        backLabel="Projects"
        actions={<Badge variant={project.status}>{project.status.replace(/_/g, ' ')}</Badge>}
      />
      <PageWrapper>
        <ProjectDetailClient
          project={project as unknown as Project}
          client={client}
          tasks={(tasks ?? []) as Task[]}
          files={(files ?? []) as ProjectFile[]}
          events={(events ?? []) as CalendarEvent[]}
          questionnaireResponse={questionnaireResponse as (QuestionnaireResponse & { template: { questions: { id: string; question: string; order: number }[] } }) | null}
        />
      </PageWrapper>
    </>
  )
}
