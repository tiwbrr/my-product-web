create table if not exists public.youtube_queue_state (
  id smallint primary key check (id = 1),
  item_count smallint not null default 0 check (item_count between 0 and 10)
);

insert into public.youtube_queue_state (id, item_count)
values (1, 0)
on conflict (id) do nothing;

create table if not exists public.youtube_queue (
  id uuid primary key,
  video_id text not null unique check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  user_id uuid not null references public.store_users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists youtube_queue_created_at_idx
  on public.youtube_queue(created_at asc, id asc);

alter table public.youtube_queue_state enable row level security;
alter table public.youtube_queue enable row level security;

create or replace function public.decrement_youtube_queue_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.youtube_queue_state
  set item_count = greatest(0, item_count - 1)
  where id = 1;
  return old;
end;
$$;

drop trigger if exists decrement_youtube_queue_count_after_delete on public.youtube_queue;
create trigger decrement_youtube_queue_count_after_delete
after delete on public.youtube_queue
for each row
execute function public.decrement_youtube_queue_count();

create or replace function public.add_youtube_queue_item(
  p_id uuid,
  p_video_id text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count smallint;
begin
  update public.youtube_queue_state
  set item_count = item_count + 1
  where id = 1 and item_count < 10
  returning item_count into v_count;

  if v_count is null then
    raise exception using errcode = 'P0001', message = 'YOUTUBE_QUEUE_FULL';
  end if;

  insert into public.youtube_queue (id, video_id, user_id)
  values (p_id, p_video_id, p_user_id);
end;
$$;

create or replace function public.remove_youtube_queue_item(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.youtube_queue where id = p_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

create or replace function public.complete_youtube_queue_item(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.youtube_queue
  where id = p_id
    and id = (
      select id from public.youtube_queue
      order by created_at asc, id asc
      limit 1
    );
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function public.add_youtube_queue_item(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.remove_youtube_queue_item(uuid) from public, anon, authenticated;
revoke all on function public.complete_youtube_queue_item(uuid) from public, anon, authenticated;
grant execute on function public.add_youtube_queue_item(uuid, text, uuid) to service_role;
grant execute on function public.remove_youtube_queue_item(uuid) to service_role;
grant execute on function public.complete_youtube_queue_item(uuid) to service_role;

notify pgrst, 'reload schema';
