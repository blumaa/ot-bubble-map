# Old-Time Bubble Map

Zoomable bubble map of old-time fiddle tunes from Slippery-Hill.

## Development

Needs Node 22 (`.nvmrc`). Copy the two Supabase env vars below into `.env.local`, then:

```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build
```

Data scripts: `npm run crawl` scrapes Slippery-Hill into `data/raw/`, `npm run build:data` writes `data/recordings.json`, `npm run suggest` proposes keywords for unmatched tunes.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, tests and a production build on every push to `main` and every pull request.

## Deploy

Any Next.js host (Vercel recommended). Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the host's env settings, then add the production URL to Supabase as described below.

## Feedback backend (Supabase)

Visitors send feedback from the Key panel's "?" button or a recording's "Report a problem" link. Rows land in `public.feedback`; admins read them at `/admin/feedback`.

- Schema and RLS: `supabase/migrations/`. Apply with `supabase db push --linked`.
- Auth settings: `supabase/config.toml` (sign-ups off). Apply with `supabase config push --project-ref ziolwnqefoiumrtmwqox`.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The secret key is never needed by the app.
- DB types: `supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts`.
- Sign in: `/admin/login` takes email and password. Needs the Email provider on (Authentication > Sign In / Providers) with sign-ups off. Set a password in the SQL editor: `update auth.users set encrypted_password = crypt('…', gen_salt('bf')) where email = '…';`

Adding an admin (sign-ups are off, so create the user first in the dashboard: Authentication > Users > Add user):

```sql
insert into public.admins (user_id) select id from auth.users where email = 'someone@example.com';
```

Going to production: add the site URL to `site_url` and `additional_redirect_urls` in `supabase/config.toml` (e.g. `https://example.com/**`) and push the config.
