alter table public.xo_rooms
  add column if not exists last_left_name text,
  add column if not exists last_left_at timestamptz;

create or replace function public.leave_xo_room(p_room_id uuid, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.xo_rooms%rowtype;
  v_user_name text;
begin
  select * into v_room
  from public.xo_rooms
  where id = p_room_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_room.host_user_id = p_user_id then
    delete from public.xo_rooms where id = p_room_id;
    return 'deleted';
  end if;

  if v_room.guest_user_id = p_user_id then
    select name into v_user_name from public.store_users where id = p_user_id;
    update public.xo_rooms
    set guest_user_id = null,
        board = repeat('.', board_size * board_size),
        turn = 'X',
        status = 'waiting',
        host_mark = 'X',
        round_number = 1,
        host_wins = 0,
        guest_wins = 0,
        room_draws = 0,
        rematch_host = false,
        rematch_guest = false,
        last_left_name = coalesce(v_user_name, 'สมาชิก'),
        last_left_at = now(),
        updated_at = now(),
        expires_at = now() + interval '6 hours'
    where id = p_room_id;
    return 'waiting';
  end if;

  return 'not_a_player';
end;
$$;

create or replace function public.leave_xo_rooms_for_user(p_user_id uuid, p_except_room_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_name text;
begin
  select name into v_user_name from public.store_users where id = p_user_id;

  update public.xo_rooms
  set guest_user_id = null,
      board = repeat('.', board_size * board_size),
      turn = 'X',
      status = 'waiting',
      host_mark = 'X',
      round_number = 1,
      host_wins = 0,
      guest_wins = 0,
      room_draws = 0,
      rematch_host = false,
      rematch_guest = false,
      last_left_name = coalesce(v_user_name, 'สมาชิก'),
      last_left_at = now(),
      updated_at = now(),
      expires_at = now() + interval '6 hours'
  where guest_user_id = p_user_id
    and (p_except_room_id is null or id <> p_except_room_id);

  delete from public.xo_rooms
  where host_user_id = p_user_id
    and (p_except_room_id is null or id <> p_except_room_id);
end;
$$;

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
  set guest_user_id = p_user_id,
      status = 'playing',
      last_left_name = null,
      last_left_at = null,
      updated_at = now(),
      expires_at = now() + interval '6 hours'
  where id = p_room_id;
end;
$$;

revoke all on function public.leave_xo_room(uuid, uuid) from public, anon, authenticated;
revoke all on function public.leave_xo_rooms_for_user(uuid, uuid) from public, anon, authenticated;
revoke all on function public.join_xo_room(uuid, uuid) from public, anon, authenticated;
grant execute on function public.leave_xo_room(uuid, uuid) to service_role;
grant execute on function public.leave_xo_rooms_for_user(uuid, uuid) to service_role;
grant execute on function public.join_xo_room(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
