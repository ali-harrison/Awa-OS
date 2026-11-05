import { createClient } from '@/lib/supabase/server'
import { ClientsClient } from './ClientsClient'
import { CLIENT_COLUMNS, type Client } from '@/types'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select(CLIENT_COLUMNS)
    .order('created_at', { ascending: false })

  return <ClientsClient clients={(clients ?? []) as Client[]} />
}
