-- Visitor feedback about tunes and the map, read and resolved by admins.

create schema if not exists private;

create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Lives in a schema the Data API does not expose, so it cannot be called as an RPC.
create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Kinds and length limits mirror src/lib/feedback.ts, which validates before insert.
create table public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('mistake', 'missing', 'idea', 'other')),
  message text not null check (char_length(message) between 1 and 2000),
  email text check (char_length(email) <= 254),
  tune_slug text check (char_length(tune_slug) <= 200),
  recording_url text check (char_length(recording_url) <= 500),
  resolved boolean not null default false
);
alter table public.feedback enable row level security;

revoke all on public.feedback from anon, authenticated;
grant insert (kind, message, email, tune_slug, recording_url) on public.feedback to anon, authenticated;
grant select on public.feedback to authenticated;
grant update (resolved) on public.feedback to authenticated;

create policy "Anyone can send feedback" on public.feedback
  for insert to anon, authenticated with check (true);
create policy "Admins read feedback" on public.feedback
  for select to authenticated using ((select private.is_admin()));
create policy "Admins resolve feedback" on public.feedback
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create index feedback_created_at_idx on public.feedback (created_at desc);
