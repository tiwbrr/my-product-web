create table if not exists public.store_users (
  id uuid primary key,
  name text not null check (char_length(name) >= 2),
  email text not null unique check (email = lower(email)),
  password_hash text not null,
  role text not null check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  token_hash text primary key,
  user_id uuid not null references public.store_users(id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

create table if not exists public.products (
  id text primary key,
  name text not null check (char_length(name) >= 2),
  category text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null check (stock >= 0),
  image text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_created_at_idx on public.products(created_at desc);

alter table public.store_users enable row level security;
alter table public.sessions enable row level security;
alter table public.products enable row level security;

-- No public policies are intentional. The app accesses these tables only from
-- server code with SUPABASE_SECRET_KEY (or the legacy service-role key), which
-- bypasses RLS.
