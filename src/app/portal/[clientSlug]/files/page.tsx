import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import { PortalFileUpload } from './PortalFileUpload'

export default async function PortalFilesPage({
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

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', session.clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: files } = project
    ? await supabase
        .from('files')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#F5F0E8] font-mono text-lg font-semibold mb-1">Files</h1>
        <p className="text-[#555050] font-mono text-sm">Documents and assets for your project</p>
      </div>

      {project && (
        <PortalFileUpload projectId={project.id} clientSlug={clientSlug} clientId={session.clientId} />
      )}

      {(files?.length ?? 0) === 0 ? (
        <div className="border border-[#1A1A1A] px-6 py-10 text-center">
          <p className="text-[#555050] font-mono text-sm">No files yet.</p>
        </div>
      ) : (
        <div className="border border-[#1A1A1A] divide-y divide-[#1A1A1A]">
          {files?.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[#F5F0E8] font-mono text-sm truncate">{f.name}</p>
                <p className="text-[#555050] font-mono text-xs mt-0.5">
                  {new Date(f.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="muted">{f.type.replace(/_/g, ' ')}</Badge>
                <Badge variant={f.uploaded_by === 'client' ? 'amber' : 'muted'}>
                  {f.uploaded_by === 'client' ? 'you' : 'ali'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
