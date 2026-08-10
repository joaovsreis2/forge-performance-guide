# Forge Deployment Runbook

Status: Release candidate

The frontend and backend deploy independently. Use HTTPS URLs in every production variable.

Current production endpoints:

```text
Frontend: https://forge.joaovsreis2.workers.dev
Backend:  https://forge-performance-api.onrender.com
```

## Backend

Create a Render Blueprint from `render.yaml` and provide the variables marked `sync: false`.
`DATABASE_URL` must be a PostgreSQL connection string with `sslmode=require` when required by the
provider. Use the public backend hostname in `DJANGO_ALLOWED_HOSTS` without a scheme.

Set both `DJANGO_CSRF_TRUSTED_ORIGINS` and `FORGE_FRONTEND_ORIGIN` to the exact public frontend
origin. Configure SMTP credentials for password recovery. The container waits for PostgreSQL,
runs migrations, collects static files and then starts Gunicorn. A deploy is healthy only when
`/health/` returns HTTP 200.

Render Free web services block outbound SMTP ports `25`, `465` and `587`. Password recovery email
therefore requires an HTTPS transactional-email backend on the Free plan, or a paid service that
allows SMTP. Keep `FORGE_PASSWORD_RECOVERY_ENABLED=false` until delivery is configured; the API
then reports that recovery is unavailable instead of attempting a connection that cannot succeed.

Before a migration, confirm that the managed PostgreSQL backup is recent. Test restoration in a
separate database before destructive schema work. Migrations must be forward compatible with the
currently deployed application during rollout.

Public PostgreSQL tables run with Row Level Security enabled and forced. The Django backend role
receives the `forge_backend_full_access` policy because authorization is enforced by Django sessions,
services and query scoping. Supabase client roles such as `anon` and `authenticated` do not receive
table policies; direct browser/database access must go through the Django API instead.

## Frontend

Connect `frontend/` to Cloudflare Workers and use:

```text
Build command: npm ci && npm run build
Deploy command: npx nitro deploy --prebuilt
```

Set the optional build variable `VITE_API_URL=/api`; production builds also default to `/api` when
the variable is omitted. Set the Cloudflare runtime variable `FORGE_API_ORIGIN=https://<backend-host>`
without the `/api` suffix. The Worker proxies `/api/*` to Django so session cookies remain first-party
on the default provider hostnames. The generated Cloudflare worker is in `frontend/.output/`. Verify
`/site.webmanifest`, `/service-worker.js` and an authenticated `/api/me/` request after deployment.

## Release Check

Run from the repository root:

```powershell
npm run test:frontend
npm run typecheck
npm run lint
npm run test:e2e
npm run build
npm run test:pwa
backend/.venv/Scripts/ruff check backend
backend/.venv/Scripts/python -m pytest backend/tests
```

Then validate account creation, password recovery delivery, one complete workout, offline reload,
queue synchronization and account deletion against the production environment.

Before public access, also confirm that provider environment variables contain no local URLs, the
Supabase backup is current, Render reports `/health/` as healthy, SMTP delivery reaches a real
inbox, and both GitHub quality workflows pass on the deployed commit.

## Rollback

Roll back the application image first. Do not reverse a database migration until its data impact
has been reviewed. If a migration changed stored data, restore into a separate database, validate
the result, and only then redirect production traffic.
