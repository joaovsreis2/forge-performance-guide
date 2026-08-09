# ADR-013: React Frontend with Django API

Status: Accepted

Date: 2026-08-08

## Context

The validated Forge prototype is implemented in React/TanStack and contains the product's most
important visual and interaction decisions. Rebuilding those screens independently in Django
Templates created visual drift and duplicated the interface layer.

## Decision

Forge will use the existing React/TanStack application as its web frontend and Django as the
Python backend. Django remains responsible for authentication, relational persistence, business
rules, offline synchronization and the domain services already covered by tests. The frontend
communicates with Django through JSON endpoints and keeps the prototype component system as the
visual source of truth.

## Consequences

- The product can preserve the prototype's visual fidelity.
- Frontend and backend can be deployed independently on free-tier services during MVP validation.
- Authentication, CSRF, CORS, API contracts and deployment configuration become explicit concerns.
- Existing server-rendered templates remain available for administration and fallback flows, but
  they are no longer the primary product UI.
- Mock client state will be removed incrementally as each React flow is connected to the API.

## Alternatives considered

Continuing with Django Templates would preserve a single deployment but require reimplementing the
prototype screen system and would continue the visual divergence that motivated this decision.
