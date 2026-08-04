# ADR-004 — Domain-Oriented Modular Architecture

Status: Accepted

Date: 2026-08-03

---

# Context

Forge requires a modular architecture capable of growing without excessive coupling.

A decision was required regarding how the application should be divided.

The alternatives included:

- organizing by Django apps for every entity;
- organizing by technical layers;
- organizing by business domains.

---

# Decision

Forge will organize its modules around business domains.

The initial domains are:

- Accounts
- Training
- Progress
- Dashboard
- Core

Each domain owns its own models, business logic and presentation layer whenever appropriate.

---

# Consequences

## Positive

- Better separation of responsibilities.
- Easier scalability.
- Clear ownership.
- Reduced coupling.
- Better onboarding.

---

## Negative

- Requires discipline when defining domain boundaries.

---

# Alternatives Considered

## One Django app per entity

Rejected.

Reason:

Creates excessive fragmentation and increases maintenance costs.

---

## Layer-first architecture

Rejected.

Reason:

Business concepts become scattered across the project.

---

# Rationale

Business domains change less frequently than technical implementation details.

Organizing around domains better reflects how the product evolves.

---

# Related Documents

- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md