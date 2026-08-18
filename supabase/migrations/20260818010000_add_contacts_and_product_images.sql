alter table public.products
  add column if not exists images text[] not null default '{}';

update public.products
set images = array[image]
where image <> '' and cardinality(images) = 0;

create table if not exists public.store_settings (
  id integer primary key check (id = 1),
  line_qr_image text not null default '',
  facebook_url text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

-- Images uploaded from the admin page are stored in this public bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets',
  'store-assets',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
