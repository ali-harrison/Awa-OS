-- AWA/OS: bring the schema into line with what the app does.
-- Safe to re-run, and safe on a database where these were already applied by hand.

-- The app reads and writes this column, but no migration ever created it.
alter table invoices
  add column if not exists stripe_payment_link text;

-- The invoice form offers "No project", which the NOT NULL constraint rejected.
alter table invoices
  alter column project_id drop not null;

-- This function reads `clients`, and the RLS policy on `clients` calls this function,
-- so any anon query recursed until Postgres ran out of stack. Running it as its owner
-- skips RLS on that inner read and breaks the loop.
create or replace function get_portal_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from clients
  where portal_token = current_setting('app.portal_token', true)
  limit 1;
$$;
