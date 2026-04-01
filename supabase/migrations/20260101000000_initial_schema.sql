-- AWA/OS Initial Schema
-- Te Wairama Digital

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

create type client_type as enum ('charity', 'gym', 'consultant', 'ecom', 'other');
create type client_status as enum ('lead', 'prospect', 'active', 'completed', 'paused');
create type project_status as enum (
  'onboarding',
  'questionnaire_sent',
  'questionnaire_received',
  'proposal_sent',
  'contract_sent',
  'deposit_pending',
  'deposit_paid',
  'in_progress',
  'review',
  'complete'
);
create type project_tier as enum ('tier1', 'tier2', 'tier3');
create type task_status as enum ('todo', 'in_progress', 'done');
create type questionnaire_client_type as enum ('charity', 'gym', 'consultant', 'ecom', 'other', 'base');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
create type file_type as enum ('brand_asset', 'document', 'image', 'contract', 'invoice', 'other');
create type file_uploader as enum ('client', 'internal');
create type calendar_event_type as enum ('deadline', 'meeting', 'milestone', 'reminder');
create type email_status as enum ('sent', 'failed');

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────

create table clients (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamp with time zone default now() not null,
  name             text not null,
  email            text not null,
  phone            text,
  company          text,
  type             client_type not null default 'other',
  slug             text not null unique,
  status           client_status not null default 'lead',
  portal_access    boolean not null default false,
  notes            text,
  portal_token     text unique  -- magic link token for client portal access
);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────

create table projects (
  id                    uuid primary key default uuid_generate_v4(),
  client_id             uuid not null references clients(id) on delete cascade,
  created_at            timestamp with time zone default now() not null,
  name                  text not null,
  status                project_status not null default 'onboarding',
  stage_updated_at      timestamp with time zone default now() not null,
  start_date            date,
  estimated_completion  date,
  tier                  project_tier,
  value                 numeric(12, 2),
  internal_notes        text
);

-- ─── TASKS ───────────────────────────────────────────────────────────────────

create table tasks (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid not null references projects(id) on delete cascade,
  title             text not null,
  description       text,
  status            task_status not null default 'todo',
  due_date          date,
  visible_to_client boolean not null default false,
  created_at        timestamp with time zone default now() not null
);

-- ─── QUESTIONNAIRE TEMPLATES ─────────────────────────────────────────────────

create table questionnaire_templates (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  client_type questionnaire_client_type not null,
  questions   jsonb not null default '[]'::jsonb
  -- questions shape: [{id, question, hint, required, order}]
);

-- ─── QUESTIONNAIRE RESPONSES ─────────────────────────────────────────────────

create table questionnaire_responses (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid not null references projects(id) on delete cascade,
  template_id      uuid not null references questionnaire_templates(id),
  custom_questions jsonb default '[]'::jsonb,
  responses        jsonb not null default '{}'::jsonb,
  submitted_at     timestamp with time zone,
  completed        boolean not null default false
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────

create table invoices (
  id                       uuid primary key default uuid_generate_v4(),
  project_id               uuid not null references projects(id) on delete cascade,
  client_id                uuid not null references clients(id) on delete cascade,
  invoice_number           text not null unique,
  status                   invoice_status not null default 'draft',
  amount                   numeric(12, 2) not null,
  gst_included             boolean not null default true,
  due_date                 date,
  paid_at                  timestamp with time zone,
  stripe_payment_intent_id text,
  line_items               jsonb not null default '[]'::jsonb,
  created_at               timestamp with time zone default now() not null
  -- line_items shape: [{description, quantity, unit_price, amount}]
);

-- ─── FILES ───────────────────────────────────────────────────────────────────

create table files (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  name         text not null,
  type         file_type not null default 'other',
  storage_path text not null,
  uploaded_by  file_uploader not null default 'internal',
  created_at   timestamp with time zone default now() not null
);

-- ─── CALENDAR EVENTS ─────────────────────────────────────────────────────────

create table calendar_events (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid references projects(id) on delete cascade,
  title             text not null,
  description       text,
  start_at          timestamp with time zone not null,
  end_at            timestamp with time zone not null,
  type              calendar_event_type not null default 'milestone',
  visible_to_client boolean not null default false
);

-- ─── EMAIL LOG ───────────────────────────────────────────────────────────────

create table email_log (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references clients(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  template_key text not null,
  subject      text not null,
  sent_at      timestamp with time zone default now() not null,
  status       email_status not null default 'sent'
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

create index idx_projects_client_id on projects(client_id);
create index idx_projects_status on projects(status);
create index idx_tasks_project_id on tasks(project_id);
create index idx_invoices_client_id on invoices(client_id);
create index idx_invoices_project_id on invoices(project_id);
create index idx_files_project_id on files(project_id);
create index idx_files_client_id on files(client_id);
create index idx_calendar_events_project_id on calendar_events(project_id);
create index idx_email_log_client_id on email_log(client_id);
create index idx_clients_slug on clients(slug);
create index idx_clients_portal_token on clients(portal_token);
