alter table public.products
  add column if not exists account_gender text not null default 'unspecified';

alter table public.products
  drop constraint if exists products_account_gender_check;

alter table public.products
  add constraint products_account_gender_check
  check (account_gender in ('male', 'female', 'unspecified'));

update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'store-assets';

notify pgrst, 'reload schema';

