import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ActivityFeed } from './ActivityFeed'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>
}) {
  const { type, page } = await searchParams
  const activeType = (type as 'email' | 'audit' | 'change') ?? null
  const currentPage = Math.max(1, parseInt(page ?? '1', 10))
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize

  const supabase = await createClient()

  let query = supabase
    .from('activity_log')
    .select('*, performed_by_email:performed_by(email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (activeType) {
    query = query.eq('type', activeType)
  }

  const { data: logs, count } = await query

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <PageWrapper title="Activity Log">
      <ActivityFeed
        logs={logs ?? []}
        activeType={activeType}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </PageWrapper>
  )
}
