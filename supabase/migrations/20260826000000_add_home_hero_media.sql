alter table public.store_settings
  add column if not exists home_hero_media_url text not null default '',
  add column if not exists home_hero_media_type text not null default '';

alter table public.store_settings
  drop constraint if exists store_settings_home_hero_media_type_check;

alter table public.store_settings
  add constraint store_settings_home_hero_media_type_check
  check (home_hero_media_type in ('', 'image', 'video'));

update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg',
      'video/mp4', 'video/webm'
    ]
where id = 'store-assets';

notify pgrst, 'reload schema';
