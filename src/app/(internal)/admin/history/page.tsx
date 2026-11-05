import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ActivityFeed } from './ActivityFeed'

const LOG_TYPES = ['email', 'audit', 'change'] as const
type LogType = (typeof LOG_TYPES)[number]

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>
}) {
  const { type, page } = await searchParams
  const activeType = LOG_TYPES.find((t): t is LogType => t === type) ?? null
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize

  const supabase = await createClient()

  let query = supabase
    .from('activity_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (activeType) {
    query = query.eq('type', activeType)
  }

  const { data: logs, count } = await query

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <>
      <Header title="History" subtitle="Emails, audit trail & changes" />
      <PageWrapper>
        <ActivityFeed
          logs={logs ?? []}
          activeType={activeType}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </PageWrapper>
    </>
  )
}
