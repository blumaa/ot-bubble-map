-- Lets a signed-in user see whether they are an admin (their own row only), so the admin pages can gate on it.
grant select on public.admins to authenticated;
create policy "Users see their own admin row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));
