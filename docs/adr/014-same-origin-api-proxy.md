# ADR-014: Same-Origin API Proxy

Status: Accepted

Date: 2026-08-09

## Context

The React frontend and Django backend deploy independently. Their default Cloudflare and Render
hostnames belong to different sites, so browser privacy controls may reject Django session cookies
as third-party cookies. Direct cross-origin API access would make authentication depend on browser
cookie policy even with valid CORS and SameSite configuration.

## Decision

The Cloudflare Worker will proxy browser requests from `/api/*` to the public Django origin stored
in `FORGE_API_ORIGIN`. Production builds set `VITE_API_URL=/api`, so authentication cookies remain
first-party from the browser's perspective. Django remains the only owner of authentication,
authorization, business rules and persistence.

API responses use `Cache-Control: no-store`, and the service worker explicitly excludes `/api`
from its cache. Local development continues to call Django directly on `127.0.0.1:8000`.

## Consequences

- Session authentication works on the default free-tier hostnames without third-party cookies.
- The frontend Worker becomes the public API entry point for browser traffic.
- `FORGE_API_ORIGIN` must be configured as a Cloudflare runtime variable.
- `VITE_API_URL` must be `/api` in production builds.
- The backend origin remains public for health checks and Django administration.
- CORS remains configured for local development and controlled direct access.

## Alternatives Considered

### Cross-site session cookies

Rejected because browser privacy settings can block them independently of application code.

### Token authentication stored in browser storage

Rejected because it would expand the authentication surface and expose bearer credentials to
client-side storage without a product requirement.

### Replacing Django authentication with a third-party identity provider

Rejected because Django already owns the tested account lifecycle and the additional service would
increase cost and complexity.
