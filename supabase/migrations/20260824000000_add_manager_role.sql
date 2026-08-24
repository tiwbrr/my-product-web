alter table public.store_users
  drop constraint if exists store_users_role_check;

alter table public.store_users
  add constraint store_users_role_check
  check (role in ('user', 'manager', 'admin'));

create or replace function public.protect_last_store_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role <> 'admin' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.role = 'admin' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('store_users:last_admin', 0));
  if (select count(*) from public.store_users where role = 'admin') <= 1 then
    raise exception using
      errcode = 'P0001',
      message = 'LAST_ADMIN';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists protect_last_store_admin_before_change on public.store_users;
create trigger protect_last_store_admin_before_change
before update of role or delete on public.store_users
for each row
execute function public.protect_last_store_admin();

create index if not exists store_users_role_created_at_idx
  on public.store_users(role, created_at desc);

notify pgrst, 'reload schema';
