create table if not exists public.records (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.records enable row level security;

drop policy if exists "Users can read their own records" on public.records;
create policy "Users can read their own records"
on public.records for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own records" on public.records;
create policy "Users can create their own records"
on public.records for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own records" on public.records;
create policy "Users can update their own records"
on public.records for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own records" on public.records;
create policy "Users can delete their own records"
on public.records for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.records to authenticated;
