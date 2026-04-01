-- AWA/OS: Add portal token columns to clients table

alter table clients
  add column if not exists portal_token uuid,
  add column if not exists portal_token_expires_at timestamptz;

-- Index for fast token lookup
create index if not exists clients_portal_token_idx on clients (portal_token);
