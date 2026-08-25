create table if not exists public.xo_player_stats (
  user_id uuid primary key references public.store_users(id) on delete cascade,
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists xo_player_stats_ranking_idx
  on public.xo_player_stats(wins desc, draws desc, losses asc, updated_at asc);

alter table public.xo_player_stats enable row level security;

create or replace function public.record_xo_match_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_wins integer := 0;
  v_host_losses integer := 0;
  v_host_draws integer := 0;
  v_guest_wins integer := 0;
  v_guest_losses integer := 0;
  v_guest_draws integer := 0;
begin
  if old.status <> 'playing' or new.status not in ('x_won', 'o_won', 'draw') or new.guest_user_id is null then
    return new;
  end if;

  if new.status = 'x_won' then
    v_host_wins := 1;
    v_guest_losses := 1;
  elsif new.status = 'o_won' then
    v_host_losses := 1;
    v_guest_wins := 1;
  else
    v_host_draws := 1;
    v_guest_draws := 1;
  end if;

  insert into public.xo_player_stats (user_id, wins, losses, draws, updated_at)
  values (new.host_user_id, v_host_wins, v_host_losses, v_host_draws, now())
  on conflict (user_id) do update
  set wins = public.xo_player_stats.wins + excluded.wins,
      losses = public.xo_player_stats.losses + excluded.losses,
      draws = public.xo_player_stats.draws + excluded.draws,
      updated_at = now();

  insert into public.xo_player_stats (user_id, wins, losses, draws, updated_at)
  values (new.guest_user_id, v_guest_wins, v_guest_losses, v_guest_draws, now())
  on conflict (user_id) do update
  set wins = public.xo_player_stats.wins + excluded.wins,
      losses = public.xo_player_stats.losses + excluded.losses,
      draws = public.xo_player_stats.draws + excluded.draws,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists record_xo_match_result_after_update on public.xo_rooms;
create trigger record_xo_match_result_after_update
after update of status on public.xo_rooms
for each row
execute function public.record_xo_match_result();

revoke all on function public.record_xo_match_result() from public, anon, authenticated;

notify pgrst, 'reload schema';
