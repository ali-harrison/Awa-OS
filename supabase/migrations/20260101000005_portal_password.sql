-- AWA/OS: Add portal password hash to clients table

alter table clients
  add column if not exists portal_password_hash text;
