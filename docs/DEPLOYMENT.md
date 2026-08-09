# Forge Deployment Runbook

Status: Release candidate

The frontend and backend deploy independently. Use HTTPS URLs in every production variable.

## Backend

Create a Render Blueprint from `render.yaml` and provide the variables marked `sync: false`.
`DATABASE_URL` must be a PostgreSQL connection string with `sslmode=require` when required by the
provider. Use the public backend hostname in `DJANGO_ALLOWED_HOSTS` without a scheme.

Set both `DJANGO_CSRF_TRUSTED_ORIGINS` and `FORGE_FRONTEND_ORIGIN` to the exact public frontend
origin. Configure SMTP credentials for password recovery. The container waits for PostgreSQL,
runs migrations, collects static files and then starts Gunicorn. A deploy is healthy only when
`/health/` returns HTTP 200.

Before a migration, confirm that the managed PostgreSQL backup is recent. Test restoration in a
separate database before destructive schema work. Migrations must be forward compatible with the
currently deployed application during rollout.

## Frontend

Connect `frontend/` to Cloudflare Workers and use:

```text
Build command: npm install && npm run build
Deploy command: npx nitro deploy --prebuilt
```

Set `VITE_API_URL` to `https://<backend-host>/api` before building. The generated Cloudflare worker
is in `frontend/.output/`. Verify `/site.webmanifest` and `/service-worker.js` after deployment.

## Release Check

Run from the repository root:

```powershell
npm run test:frontend
npm run test:e2e
npm run build
npm run test:pwa
backend/.venv/Scripts/ruff check backend
backend/.venv/Scripts/python -m pytest backend/tests
```

Then validate account creation, password recovery delivery, one complete workout, offline reload,
queue synchronization and account deletion against the production environment.

## Rollback

Roll back the application image first. Do not reverse a database migration until its data impact
has been reviewed. If a migration changed stored data, restore into a separate database, validate
the result, and only then redirect production traffic.
