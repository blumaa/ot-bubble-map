-- Target for the keep-alive workflow (.github/workflows/keep-alive.yml).
-- Free-tier projects pause after 7 days idle; a scheduled call keeps this one awake.
-- Reads no data, so anon may call it.
create function public.keep_alive() returns integer
language sql stable
as $$ select 1 $$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon;
