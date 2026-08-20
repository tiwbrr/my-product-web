alter table public.chat_messages
  drop constraint if exists chat_messages_message_check;

alter table public.chat_messages
  add constraint chat_messages_message_check
  check (char_length(message) between 1 and 300);

create index if not exists chat_messages_user_created_at_idx
  on public.chat_messages(user_id, created_at desc);

create or replace function public.enforce_chat_message_cooldown()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if exists (
    select 1
    from public.chat_messages
    where user_id = new.user_id
      and created_at > now() - interval '5 seconds'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'CHAT_COOLDOWN';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_chat_message_cooldown_before_insert on public.chat_messages;
create trigger enforce_chat_message_cooldown_before_insert
before insert on public.chat_messages
for each row
execute function public.enforce_chat_message_cooldown();

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.store_users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  expiration_time bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- The app accesses subscriptions with the server-side service role only.
notify pgrst, 'reload schema';
