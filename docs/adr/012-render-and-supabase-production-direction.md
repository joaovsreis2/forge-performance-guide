# ADR-012 — Render and Supabase Production Direction

Status: Accepted

Date: 2026-08-07

---

# Context

Forge needs a deployment path that allows the product to run outside the developer machine while
preserving the approved Django modular monolith and PostgreSQL architecture.

The initial expected usage is very small, likely one user during MVP development and portfolio
validation. The deployment approach should minimize cost and operational complexity.

---

# Decision

Forge will target the following production direction for the MVP:

- Render for the Django web application;
- Supabase PostgreSQL for the managed production database;
- GitHub-connected deployment;
- Docker Compose remains available for local development but is optional.

The production application must not depend on the developer machine being online.

---

# Consequences

## Positive

- Keeps the official Django and PostgreSQL architecture.
- Avoids running PostgreSQL on the developer machine when not desired.
- Provides a public deployment path suitable for one-user MVP validation.
- Keeps operational work small during early product development.

## Negative

- Free-tier services may sleep after inactivity.
- Free-tier limits are not a guarantee for long-term production use.
- Future production hardening may require paid services.

---

# Alternatives Considered

## Vercel and Supabase

Deferred.

Reason:

Vercel can run Django through serverless Python functions, but Render is a more natural fit for a
traditional Django server-rendered application.

---

## Local Docker as Production

Rejected.

Reason:

The product would depend on the developer machine being online and available.

---

## VPS

Deferred.

Reason:

A VPS can be inexpensive, but it increases responsibility for server maintenance, security,
updates, backups and deployment operations.

---

# Related Documents

- PROJECT-CONSTITUTION.md
- ROADMAP.md
- ADR-006 — Product Specification Independent from Implementation
