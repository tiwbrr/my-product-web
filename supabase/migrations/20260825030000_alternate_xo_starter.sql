alter table public.xo_rooms
  add column if not exists host_mark text not null default 'X' check (host_mark in ('X', 'O'));

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
      host_mark = case when v_host_ready and v_guest_ready then case when host_mark = 'X' then 'O' else 'X' end else host_mark end,
      rematch_host = case when v_host_ready and v_guest_ready then false else v_host_ready end,
      rematch_guest = case when v_host_ready and v_guest_ready then false else v_guest_ready end,
      updated_at = now(),
      expires_at = now() + interval '6 hours'
  where id = p_room_id;
end;
$$;

create or replace function public.record_xo_match_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_x_user_id uuid;
  v_o_user_id uuid;
  v_x_wins integer := 0;
  v_x_losses integer := 0;
  v_x_draws integer := 0;
  v_o_wins integer := 0;
  v_o_losses integer := 0;
  v_o_draws integer := 0;
begin
  if old.status <> 'playing' or new.status not in ('x_won', 'o_won', 'draw') or new.guest_user_id is null then
    return new;
  end if;

  if new.host_mark = 'X' then
    v_x_user_id := new.host_user_id;
    v_o_user_id := new.guest_user_id;
  else
    v_x_user_id := new.guest_user_id;
    v_o_user_id := new.host_user_id;
  end if;

  if new.status = 'x_won' then
    v_x_wins := 1;
    v_o_losses := 1;
  elsif new.status = 'o_won' then
    v_x_losses := 1;
    v_o_wins := 1;
  else
    v_x_draws := 1;
    v_o_draws := 1;
  end if;

  insert into public.xo_player_stats (user_id, wins, losses, draws, updated_at)
  values (v_x_user_id, v_x_wins, v_x_losses, v_x_draws, now())
  on conflict (user_id) do update
  set wins = public.xo_player_stats.wins + excluded.wins,
      losses = public.xo_player_stats.losses + excluded.losses,
      draws = public.xo_player_stats.draws + excluded.draws,
      updated_at = now();

  insert into public.xo_player_stats (user_id, wins, losses, draws, updated_at)
  values (v_o_user_id, v_o_wins, v_o_losses, v_o_draws, now())
  on conflict (user_id) do update
  set wins = public.xo_player_stats.wins + excluded.wins,
      losses = public.xo_player_stats.losses + excluded.losses,
      draws = public.xo_player_stats.draws + excluded.draws,
      updated_at = now();

  return new;
end;
$$;

revoke all on function public.play_xo_move(uuid, uuid, smallint) from public, anon, authenticated;
revoke all on function public.request_xo_rematch(uuid, uuid) from public, anon, authenticated;
grant execute on function public.play_xo_move(uuid, uuid, smallint) to service_role;
grant execute on function public.request_xo_rematch(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
