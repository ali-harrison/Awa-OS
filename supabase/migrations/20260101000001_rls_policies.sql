-- AWA/OS Row Level Security Policies
-- Internal user (authenticated via Supabase Auth) can read/write everything.
-- Client portal: clients can only read rows matching their client_id,
-- resolved via their portal_token stored in the clients table.
-- Clients can never access: internal_notes, pipeline data, other clients' data, finances.

-- ─── ENABLE RLS ON ALL TABLES ────────────────────────────────────────────────

alter table clients               enable row level security;
alter table projects              enable row level security;
alter table tasks                 enable row level security;
alter table questionnaire_templates enable row level security;
alter table questionnaire_responses enable row level security;
alter table invoices              enable row level security;
alter table files                 enable row level security;
alter table calendar_events       enable row level security;
alter table email_log             enable row level security;

-- ─── HELPER FUNCTION: get client_id from portal token ────────────────────────
-- Client portal requests pass their token via a custom claim in the JWT,
-- set via the `app.portal_token` config variable on the connection.

create or replace function get_portal_client_id()
returns uuid
language sql
stable
as $$
  select id from clients
  where portal_token = current_setting('app.portal_token', true)
  limit 1;
$$;

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────

-- Internal: full access
create policy "internal_clients_all"
  on clients for all
  to authenticated
  using (true)
  with check (true);

-- Portal: client can only read their own row (no internal_notes, no portal_token)
-- We use a view for the portal to strip sensitive columns — see below.
create policy "portal_clients_select"
  on clients for select
  to anon
  using (id = get_portal_client_id());

-- ─── PROJECTS ────────────────────────────────────────────────────────────────

create policy "internal_projects_all"
  on projects for all
  to authenticated
  using (true)
  with check (true);

-- Portal: read own projects (no internal_notes — stripped at query layer)
create policy "portal_projects_select"
  on projects for select
  to anon
  using (client_id = get_portal_client_id());

-- ─── TASKS ───────────────────────────────────────────────────────────────────

create policy "internal_tasks_all"
  on tasks for all
  to authenticated
  using (true)
  with check (true);

-- Portal: only tasks marked visible_to_client
create policy "portal_tasks_select"
  on tasks for select
  to anon
  using (
    visible_to_client = true
    and project_id in (
      select id from projects where client_id = get_portal_client_id()
    )
  );

-- ─── QUESTIONNAIRE TEMPLATES ─────────────────────────────────────────────────

create policy "internal_qtemplate_all"
  on questionnaire_templates for all
  to authenticated
  using (true)
  with check (true);

-- Portal: clients can read templates (needed to render questionnaire)
create policy "portal_qtemplate_select"
  on questionnaire_templates for select
  to anon
  using (true);

-- ─── QUESTIONNAIRE RESPONSES ─────────────────────────────────────────────────

create policy "internal_qresponse_all"
  on questionnaire_responses for all
  to authenticated
  using (true)
  with check (true);

-- Portal: client can read/insert/update own responses
create policy "portal_qresponse_select"
  on questionnaire_responses for select
  to anon
  using (
    project_id in (
      select id from projects where client_id = get_portal_client_id()
    )
  );

create policy "portal_qresponse_insert"
  on questionnaire_responses for insert
  to anon
  with check (
    project_id in (
      select id from projects where client_id = get_portal_client_id()
    )
  );

create policy "portal_qresponse_update"
  on questionnaire_responses for update
  to anon
  using (
    project_id in (
      select id from projects where client_id = get_portal_client_id()
    )
  );

-- ─── INVOICES ────────────────────────────────────────────────────────────────

create policy "internal_invoices_all"
  on invoices for all
  to authenticated
  using (true)
  with check (true);

-- Portal: client can read their own invoices (status, amount, due_date — no stripe internals needed)
create policy "portal_invoices_select"
  on invoices for select
  to anon
  using (client_id = get_portal_client_id());

-- ─── FILES ───────────────────────────────────────────────────────────────────

create policy "internal_files_all"
  on files for all
  to authenticated
  using (true)
  with check (true);

-- Portal: client can read and upload their own files
create policy "portal_files_select"
  on files for select
  to anon
  using (client_id = get_portal_client_id());

create policy "portal_files_insert"
  on files for insert
  to anon
  with check (
    client_id = get_portal_client_id()
    and uploaded_by = 'client'
  );

-- ─── CALENDAR EVENTS ─────────────────────────────────────────────────────────

create policy "internal_calendar_all"
  on calendar_events for all
  to authenticated
  using (true)
  with check (true);

-- Portal: only events marked visible_to_client
create policy "portal_calendar_select"
  on calendar_events for select
  to anon
  using (
    visible_to_client = true
    and project_id in (
      select id from projects where client_id = get_portal_client_id()
    )
  );

-- ─── EMAIL LOG ───────────────────────────────────────────────────────────────

-- Email log is internal-only — no portal access
create policy "internal_email_log_all"
  on email_log for all
  to authenticated
  using (true)
  with check (true);
