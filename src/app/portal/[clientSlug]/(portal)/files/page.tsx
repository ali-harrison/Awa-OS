import { createServiceClient } from '@/lib/supabase/server'
import { getLatestProject, requirePortalClient } from '@/lib/portal/auth'
import { formatDate } from '@/lib/format'
import { FILES_BUCKET } from '@/lib/storage'
import { Badge } from '@/components/ui/Badge'
import { Card, EmptyState } from '@/components/ui/Card'
import { PortalFileUpload } from './PortalFileUpload'

export default async function PortalFilesPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await requirePortalClient(clientSlug)
  const project = await getLatestProject(client.id)
  const supabase = createServiceClient()

  const { data: files } = project
    ? await supabase
        .from('files')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  // The bucket is private, so downloads go through short-lived signed links
  const { data: signed } = files?.length
    ? await supabase.storage
        .from(FILES_BUCKET)
        .createSignedUrls(files.map((f) => f.storage_path), 60 * 60, { download: true })
    : { data: [] }
  const downloadUrls = new Map(signed?.map((s) => [s.path, s.signedUrl]))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[36px] leading-tight text-bone">Files</h1>
        <p className="mt-1 text-muted">Documents and assets for your project</p>
      </div>

      {project && <PortalFileUpload clientSlug={clientSlug} />}

      {(files?.length ?? 0) === 0 ? (
        <EmptyState title="No files yet" />
      ) : (
        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {files?.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-bone">{f.name}</p>
                <p className="mt-0.5 font-mono text-xs text-dim">{formatDate(f.created_at, 'medium')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                {f.uploaded_by === 'client' && <Badge variant="amber">You</Badge>}
                {downloadUrls.get(f.storage_path) && (
                  <a
                    href={downloadUrls.get(f.storage_path)}
                    className="text-[13px] text-muted transition-colors hover:text-amber"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
