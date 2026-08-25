alter table public.xo_rooms
  add column if not exists board_size smallint not null default 3 check (board_size in (3, 5, 10));

alter table public.xo_rooms drop constraint if exists xo_rooms_board_check;
alter table public.xo_rooms
  add constraint xo_rooms_board_check
  check (board ~ '^[XO.]+$' and length(board) = board_size * board_size);

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
  v_won boolean := false;
  v_status text;
  v_win_length integer;
  v_row integer;
  v_col integer;
  v_direction integer;
  v_dr integer;
  v_dc integer;
  v_step integer;
  v_next_row integer;
  v_next_col integer;
  v_count integer;
begin
  select * into v_room from public.xo_rooms where id = p_room_id for update;
  if not found or v_room.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'XO_ROOM_NOT_FOUND';
  end if;
  if p_cell < 0 or p_cell >= v_room.board_size * v_room.board_size then
    raise exception using errcode = 'P0001', message = 'XO_INVALID_CELL';
  end if;
  if v_room.status <> 'playing' then
    raise exception using errcode = 'P0001', message = 'XO_GAME_NOT_PLAYING';
  end if;

  if v_room.host_user_id = p_user_id then
    v_mark := v_room.host_mark;
  elsif v_room.guest_user_id = p_user_id then
    v_mark := case when v_room.host_mark = 'X' then 'O' else 'X' end;
  else
    raise exception using errcode = 'P0001', message = 'XO_NOT_A_PLAYER';
  end if;

  if v_room.turn <> v_mark then
    raise exception using errcode = 'P0001', message = 'XO_NOT_YOUR_TURN';
  end if;
  if substr(v_room.board, p_cell + 1, 1) <> '.' then
    raise exception using errcode = 'P0001', message = 'XO_CELL_TAKEN';
  end if;

  v_board := overlay(v_room.board placing v_mark from p_cell + 1 for 1);
  v_win_length := case v_room.board_size when 3 then 3 when 5 then 4 else 5 end;
  v_row := p_cell / v_room.board_size;
  v_col := p_cell % v_room.board_size;

  for v_direction in 0..3 loop
    v_dr := case v_direction when 0 then 0 else 1 end;
    v_dc := case v_direction when 0 then 1 when 1 then 0 when 2 then 1 else -1 end;
    v_count := 1;

    for v_step in 1..v_win_length - 1 loop
      v_next_row := v_row + v_dr * v_step;
      v_next_col := v_col + v_dc * v_step;
      exit when v_next_row < 0 or v_next_row >= v_room.board_size or v_next_col < 0 or v_next_col >= v_room.board_size;
      exit when substr(v_board, v_next_row * v_room.board_size + v_next_col + 1, 1) <> v_mark;
      v_count := v_count + 1;
    end loop;

    for v_step in 1..v_win_length - 1 loop
      v_next_row := v_row - v_dr * v_step;
      v_next_col := v_col - v_dc * v_step;
      exit when v_next_row < 0 or v_next_row >= v_room.board_size or v_next_col < 0 or v_next_col >= v_room.board_size;
      exit when substr(v_board, v_next_row * v_room.board_size + v_next_col + 1, 1) <> v_mark;
      v_count := v_count + 1;
    end loop;

    if v_count >= v_win_length then
      v_won := true;
      exit;
    end if;
  end loop;

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
  set board = case when v_host_ready and v_guest_ready then repeat('.', board_size * board_size) else board end,
      turn = case when v_host_ready and v_guest_ready then 'X' else turn end,
      status = case when v_host_ready and v_guest_ready then 'playing' else status end,
      host_mark = case when v_host_ready and v_guest_ready then case when host_mark = 'X' then 'O' else 'X' end else host_mark end,
      rematch_host = case when v_host_ready and v_guest_ready then false else v_host_ready end,
      rematch_guest = case when v_host_ready and v_guest_ready then false else v_guest_ready end,
      updated_at = now(),
      expires_at = now() + interval '6 hours'
  where id = p_room_id;
end;
$$;

revoke all on function public.play_xo_move(uuid, uuid, smallint) from public, anon, authenticated;
revoke all on function public.request_xo_rematch(uuid, uuid) from public, anon, authenticated;
grant execute on function public.play_xo_move(uuid, uuid, smallint) to service_role;
grant execute on function public.request_xo_rematch(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
