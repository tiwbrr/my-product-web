create table if not exists public.game_characters (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.game_categories(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  sort_order bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists game_characters_category_name_idx
  on public.game_characters(category_id, lower(name));

create index if not exists game_characters_sort_idx
  on public.game_characters(category_id, sort_order, name);

alter table public.game_characters enable row level security;

alter table public.products
  add column if not exists character_ids uuid[] not null default '{}';

create index if not exists products_character_ids_idx
  on public.products using gin(character_ids);

create or replace function public.remove_deleted_character_from_products()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set character_ids = array_remove(character_ids, old.id),
      updated_at = now()
  where character_ids @> array[old.id];
  return old;
end;
$$;

drop trigger if exists remove_deleted_character_from_products_after_delete on public.game_characters;
create trigger remove_deleted_character_from_products_after_delete
after delete on public.game_characters
for each row
execute function public.remove_deleted_character_from_products();

revoke all on function public.remove_deleted_character_from_products() from public, anon, authenticated;

notify pgrst, 'reload schema';
