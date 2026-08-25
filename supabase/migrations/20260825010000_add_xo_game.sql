alter table public.store_settings
  add column if not exists xo_game_enabled boolean not null default true;

create table if not exists public.xo_rooms (
  id uuid primary key,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_user_id uuid not null references public.store_users(id) on delete cascade,
  guest_user_id uuid references public.store_users(id) on delete cascade,
  board text not null default '.........' check (board ~ '^[XO.]{9}$'),
  turn text not null default 'X' check (turn in ('X', 'O')),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'x_won', 'o_won', 'draw')),
  rematch_host boolean not null default false,
  rematch_guest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours'),
  check (guest_user_id is null or guest_user_id <> host_user_id)
);

create index if not exists xo_rooms_code_idx on public.xo_rooms(code);
create index if not exists xo_rooms_players_idx on public.xo_rooms(host_user_id, guest_user_id, updated_at desc);
create index if not exists xo_rooms_expires_at_idx on public.xo_rooms(expires_at);

alter table public.xo_rooms enable row level security;

create or replace function public.join_xo_room(p_room_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.xo_rooms%rowtype;
begin
  select * into v_room from public.xo_rooms where id = p_room_id for update;
  if not found or v_room.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'XO_ROOM_NOT_FOUND';
  end if;
  if v_room.host_user_id = p_user_id then
    raise exception using errcode = 'P0001', message = 'XO_CANNOT_JOIN_OWN_ROOM';
  end if;
  if v_room.guest_user_id is not null or v_room.status <> 'waiting' then
    raise exception using errcode = 'P0001', message = 'XO_ROOM_FULL';
  end if;

  update public.xo_rooms
  set guest_user_id = p_user_id, status = 'playing', updated_at = now(), expires_at = now() + interval '6 hours'
  where id = p_room_id;
end;
$$;

create or replace function public.play_xo_move(p_room_id uuid, p_user_id uuid, p_cell smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.xo_rooms%rowtype;
  v_mark text;
  v_board text;
  v_won boolean;
  v_status text;
begin
  if p_cell < 0 or p_cell > 8 then
    raise exception using errcode = 'P0001', message = 'XO_INVALID_CELL';
  end if;

  select * into v_room from public.xo_rooms where id = p_room_id for update;
  if not found or v_room.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'XO_ROOM_NOT_FOUND';
  end if;
  if v_room.status <> 'playing' then
    raise exception using errcode = 'P0001', message = 'XO_GAME_NOT_PLAYING';
  end if;

  if v_room.host_user_id = p_user_id then v_mark := 'X';
  elsif v_room.guest_user_id = p_user_id then v_mark := 'O';
  else raise exception using errcode = 'P0001', message = 'XO_NOT_A_PLAYER';
  end if;

  if v_room.turn <> v_mark then
    raise exception using errcode = 'P0001', message = 'XO_NOT_YOUR_TURN';
  end if;
  if substr(v_room.board, p_cell + 1, 1) <> '.' then
    raise exception using errcode = 'P0001', message = 'XO_CELL_TAKEN';
  end if;

  v_board := overlay(v_room.board placing v_mark from p_cell + 1 for 1);
  v_won :=
    (substr(v_board,1,1)=v_mark and substr(v_board,2,1)=v_mark and substr(v_board,3,1)=v_mark) or
    (substr(v_board,4,1)=v_mark and substr(v_board,5,1)=v_mark and substr(v_board,6,1)=v_mark) or
    (substr(v_board,7,1)=v_mark and substr(v_board,8,1)=v_mark and substr(v_board,9,1)=v_mark) or
    (substr(v_board,1,1)=v_mark and substr(v_board,4,1)=v_mark and substr(v_board,7,1)=v_mark) or
    (substr(v_board,2,1)=v_mark and substr(v_board,5,1)=v_mark and substr(v_board,8,1)=v_mark) or
    (substr(v_board,3,1)=v_mark and substr(v_board,6,1)=v_mark and substr(v_board,9,1)=v_mark) or
    (substr(v_board,1,1)=v_mark and substr(v_board,5,1)=v_mark and substr(v_board,9,1)=v_mark) or
    (substr(v_board,3,1)=v_mark and substr(v_board,5,1)=v_mark and substr(v_board,7,1)=v_mark);
  v_status := case when v_won then lower(v_mark) || '_won' when position('.' in v_board) = 0 then 'draw' else 'playing' end;

  update public.xo_rooms
  set board = v_board,
      turn = case when v_mark = 'X' then 'O' else 'X' end,
      status = v_status,
      rematch_host = false,
      rematch_guest = false,
      updated_at = now(),
      expires_at = now() + interval '6 hours'
  where id = p_room_id;
end;
$$;

create or replace function public.request_xo_rematch(p_room_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.xo_rooms%rowtype;
  v_host_ready boolean;
  v_guest_ready boolean;
begin
  select * into v_room from public.xo_rooms where id = p_room_id for update;
  if not found or v_room.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'XO_ROOM_NOT_FOUND';
  end if;
  if v_room.status not in ('x_won', 'o_won', 'draw') then
    raise exception using errcode = 'P0001', message = 'XO_GAME_NOT_FINISHED';
  end if;
  if v_room.host_user_id <> p_user_id and v_room.guest_user_id <> p_user_id then
    raise exception using errcode = 'P0001', message = 'XO_NOT_A_PLAYER';
  end if;

  v_host_ready := v_room.rematch_host or v_room.host_user_id = p_user_id;
  v_guest_ready := v_room.rematch_guest or v_room.guest_user_id = p_user_id;
  update public.xo_rooms
  set board = case when v_host_ready and v_guest_ready then '.........' else board end,
      turn = case when v_host_ready and v_guest_ready then 'X' else turn end,
      status = case when v_host_ready and v_guest_ready then 'playing' else status end,
      rematch_host = case when v_host_ready and v_guest_ready then false else v_host_ready end,
      rematch_guest = case when v_host_ready and v_guest_ready then false else v_guest_ready end,
      updated_at = now(),
      expires_at = now() + interval '6 hours'
  where id = p_room_id;
end;
$$;

revoke all on function public.join_xo_room(uuid, uuid) from public, anon, authenticated;
revoke all on function public.play_xo_move(uuid, uuid, smallint) from public, anon, authenticated;
revoke all on function public.request_xo_rematch(uuid, uuid) from public, anon, authenticated;
grant execute on function public.join_xo_room(uuid, uuid) to service_role;
grant execute on function public.play_xo_move(uuid, uuid, smallint) to service_role;
grant execute on function public.request_xo_rematch(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
