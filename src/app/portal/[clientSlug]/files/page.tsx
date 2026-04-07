import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import { PortalFileUpload } from './PortalFileUpload'

const card = {
  background: '#0f0f0f',
  border: '1px solid #1f1f1f',
  borderRadius: 6,
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
} as const

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
        <h1 className="font-mono text-lg font-semibold mb-1" style={{ color: '#f0ece3' }}>Files</h1>
        <p className="font-mono text-sm" style={{ color: '#555555' }}>Documents and assets for your project</p>
      </div>

      {project && (
        <PortalFileUpload projectId={project.id} clientSlug={clientSlug} clientId={session.clientId} />
      )}

      {(files?.length ?? 0) === 0 ? (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <p className="font-mono text-sm" style={{ color: '#555555' }}>No files yet.</p>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          {files?.map((f, i) => (
            <div
              key={f.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < (files.length - 1) ? '1px solid #1f1f1f' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm truncate" style={{ color: '#f0ece3' }}>{f.name}</p>
                <p className="font-mono text-xs mt-0.5" style={{ color: '#555555' }}>
                  {new Date(f.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="font-mono uppercase"
                  style={{ fontSize: 10, letterSpacing: '0.08em', color: '#555555', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 3, padding: '2px 8px' }}
                >
                  {f.type.replace(/_/g, ' ')}
                </span>
                {f.uploaded_by === 'client' && (
                  <span
                    className="font-mono uppercase"
                    style={{ fontSize: 10, letterSpacing: '0.08em', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3, padding: '2px 8px' }}
                  >
                    you
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
