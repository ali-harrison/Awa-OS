-- AWA/OS: Unified activity log

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  type text not null check (type in ('email', 'audit', 'change')),
  entity text,
  entity_id uuid,
  action text,
  meta jsonb default '{}',
  performed_by uuid references auth.users(id)
);

create index on activity_log (created_at desc);
create index on activity_log (entity_id);
create index on activity_log (type);

-- RLS
alter table activity_log enable row level security;

create policy "Authenticated users can read activity_log"
  on activity_log for select
  to authenticated
  using (true);

create policy "Service role can insert activity_log"
  on activity_log for insert
  to authenticated
  with check (true);
