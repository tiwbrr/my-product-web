create table if not exists public.contact_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  description text not null default '' check (char_length(description) <= 160),
  url text not null default '',
  icon_image text not null default '',
  qr_image text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_channels_destination_check check (url <> '' or qr_image <> '')
);

create index if not exists contact_channels_sort_order_idx
  on public.contact_channels(sort_order asc, created_at asc);

alter table public.contact_channels enable row level security;

-- Preserve the fixed LINE and Facebook settings from earlier versions.
insert into public.contact_channels (name, description, qr_image, sort_order)
select 'LINE', 'สแกน QR Code เพื่อเพิ่มเพื่อน', line_qr_image, 10
from public.store_settings
where id = 1 and line_qr_image <> ''
  and not exists (select 1 from public.contact_channels where lower(name) = 'line');

insert into public.contact_channels (name, description, url, sort_order)
select 'Facebook', 'เปิดหน้า Facebook ของร้าน', facebook_url, 20
from public.store_settings
where id = 1 and facebook_url <> ''
  and not exists (select 1 from public.contact_channels where lower(name) = 'facebook');

notify pgrst, 'reload schema';
