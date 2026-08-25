alter table public.store_settings
  add column if not exists youtube_queue_enabled boolean not null default true;

notify pgrst, 'reload schema';
