alter table public.xo_rooms
  add column if not exists round_number integer not null default 1 check (round_number >= 1);

update public.xo_rooms
set round_number = 2
where host_mark = 'O' and round_number = 1;

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
  v_start_next_round boolean;
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
  v_start_next_round := v_host_ready and v_guest_ready;

  update public.xo_rooms
  set board = case when v_start_next_round then repeat('.', board_size * board_size) else board end,
      turn = case when v_start_next_round then 'X' else turn end,
      status = case when v_start_next_round then 'playing' else status end,
      round_number = case when v_start_next_round then round_number + 1 else round_number end,
      host_mark = case
        when v_start_next_round and (round_number + 1) % 2 = 1 then 'X'
        when v_start_next_round then 'O'
        else host_mark
      end,
      rematch_host = case when v_start_next_round then false else v_host_ready end,
      rematch_guest = case when v_start_next_round then false else v_guest_ready end,
      updated_at = now(),
      expires_at = now() + interval '6 hours'
  where id = p_room_id;
end;
$$;

revoke all on function public.request_xo_rematch(uuid, uuid) from public, anon, authenticated;
grant execute on function public.request_xo_rematch(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
