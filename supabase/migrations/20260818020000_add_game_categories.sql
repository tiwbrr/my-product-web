create table if not exists public.game_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) >= 2),
  icon text not null default '',
  sort_order bigint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.game_categories (name, sort_order)
values ('Genshin', 1), ('Wuthering Wave', 2)
on conflict (name) do nothing;

alter table public.game_categories enable row level security;

notify pgrst, 'reload schema';
