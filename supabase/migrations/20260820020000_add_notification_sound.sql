alter table public.store_settings
  add column if not exists notification_sound_url text not null default '';

update storage.buckets
set
  file_size_limit = 20971520,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg'
  ]
where id = 'store-assets';

notify pgrst, 'reload schema';
