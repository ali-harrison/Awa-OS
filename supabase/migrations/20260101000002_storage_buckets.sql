-- AWA/OS Storage Bucket Setup
-- All project files go to 'project-files'
-- Organised as /{clientSlug}/{projectId}/{type}/

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  52428800, -- 50MB limit
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]
);

-- Internal: full access to project-files
create policy "internal_storage_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'project-files')
  with check (bucket_id = 'project-files');

-- Portal: clients can read files in their own client folder
create policy "portal_storage_select"
  on storage.objects for select
  to anon
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] in (
      select slug from clients where id = get_portal_client_id()
    )
  );

-- Portal: clients can upload to their own client folder
create policy "portal_storage_insert"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] in (
      select slug from clients where id = get_portal_client_id()
    )
  );
