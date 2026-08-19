alter table public.store_settings
  add column if not exists youtube_playlist_url text not null default '';

create table if not exists public.chat_messages (
  id uuid primary key,
  user_id uuid not null references public.store_users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_at_idx
  on public.chat_messages(created_at asc);

create index if not exists chat_messages_user_id_idx
  on public.chat_messages(user_id);

alter table public.chat_messages enable row level security;

-- The app uses the server-side service role. No public policies are intentional.
create or replace function public.purge_expired_chat_messages_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.chat_messages
  where created_at < now() - interval '7 days';
  return new;
end;
$$;

drop trigger if exists purge_expired_chat_messages_before_insert on public.chat_messages;
create trigger purge_expired_chat_messages_before_insert
before insert on public.chat_messages
for each statement
execute function public.purge_expired_chat_messages_on_insert();

-- Cleanup also runs before every app read. If pg_cron is enabled in Supabase,
-- this optional block additionally removes expired rows every hour while idle.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'purge-expired-store-chat') then
      perform cron.schedule(
        'purge-expired-store-chat',
        '17 * * * *',
        $cron$delete from public.chat_messages where created_at < now() - interval '7 days'$cron$
      );
    end if;
  end if;
exception
  when insufficient_privilege or undefined_table or undefined_function then
    null;
end;
$$;

notify pgrst, 'reload schema';
