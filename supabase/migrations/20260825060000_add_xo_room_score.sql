alter table public.xo_rooms
  add column if not exists host_wins integer not null default 0 check (host_wins >= 0),
  add column if not exists guest_wins integer not null default 0 check (guest_wins >= 0),
  add column if not exists room_draws integer not null default 0 check (room_draws >= 0);

create or replace function public.update_xo_room_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status <> 'playing' or new.status not in ('x_won', 'o_won', 'draw') then
    return new;
  end if;

  if new.status = 'draw' then
    new.room_draws := old.room_draws + 1;
  elsif (new.status = 'x_won' and new.host_mark = 'X') or (new.status = 'o_won' and new.host_mark = 'O') then
    new.host_wins := old.host_wins + 1;
  else
    new.guest_wins := old.guest_wins + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists update_xo_room_score_before_status on public.xo_rooms;
create trigger update_xo_room_score_before_status
before update of status on public.xo_rooms
for each row
execute function public.update_xo_room_score();

revoke all on function public.update_xo_room_score() from public, anon, authenticated;

notify pgrst, 'reload schema';
