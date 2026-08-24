create table if not exists public.password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references public.store_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_created_at_idx
  on public.password_reset_tokens(user_id, created_at desc);

create index if not exists password_reset_tokens_expires_at_idx
  on public.password_reset_tokens(expires_at);

alter table public.password_reset_tokens enable row level security;

create or replace function public.create_store_password_reset_token(
  p_id uuid,
  p_user_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('password-reset:' || p_user_id::text, 0));

  delete from public.password_reset_tokens
  where expires_at < now() - interval '1 day';

  if exists (
    select 1 from public.password_reset_tokens
    where user_id = p_user_id
      and created_at > now() - interval '60 seconds'
  ) or (
    select count(*) from public.password_reset_tokens
    where user_id = p_user_id
      and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception using errcode = 'P0001', message = 'RESET_RATE_LIMIT';
  end if;

  update public.password_reset_tokens
  set used_at = now()
  where user_id = p_user_id and used_at is null;

  insert into public.password_reset_tokens (id, user_id, token_hash, expires_at)
  values (p_id, p_user_id, p_token_hash, p_expires_at);
end;
$$;

create or replace function public.reset_store_user_password(
  p_token_hash text,
  p_password_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id
  from public.password_reset_tokens
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  for update;

  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'RESET_TOKEN_INVALID';
  end if;

  update public.store_users
  set password_hash = p_password_hash
  where id = v_user_id;

  delete from public.sessions where user_id = v_user_id;

  update public.password_reset_tokens
  set used_at = now()
  where user_id = v_user_id and used_at is null;

  return v_user_id;
end;
$$;

revoke all on function public.create_store_password_reset_token(uuid, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.reset_store_user_password(text, text) from public, anon, authenticated;
grant execute on function public.create_store_password_reset_token(uuid, uuid, text, timestamptz) to service_role;
grant execute on function public.reset_store_user_password(text, text) to service_role;

notify pgrst, 'reload schema';
