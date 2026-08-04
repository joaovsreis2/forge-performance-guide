# ADR-002 — Product Vision

Status: Accepted

Date: 2026-08-03

---

# Context

The Forge project aims to become a long-term software product rather than a simple portfolio application.

Early architectural discussions revealed a tendency to define technologies, modules and implementation details before establishing the product's identity.

Without a clearly defined product vision, future decisions risk becoming technology-driven instead of product-driven.

The team requires a single document describing why Forge exists, who it serves, what problems it solves and what it intentionally avoids becoming.

---

# Decision

Create a dedicated Product Vision document.

The Product Vision becomes the reference for every product decision.

It defines:

- the product mission;
- the long-term vision;
- target audience;
- product positioning;
- emotional goals;
- product principles;
- non-goals;
- success definition.

Every future product decision should align with this document.

The Product Vision is intentionally separated from technical documentation.

Technical documents describe **how** Forge works.

The Product Vision describes **why** Forge exists.

---

# Consequences

## Positive

- Product decisions become consistent.
- UX decisions become easier.
- Feature prioritization becomes objective.
- Future contributors understand the project's purpose.
- Technical architecture becomes aligned with business goals.
- AI assistants receive a stable product context.

---

## Negative

- Product changes require updating multiple documents.
- Major pivots become more structured.

---

# Alternatives Considered

## Merge Product Vision into Product & Technical Specification

Rejected.

Reason:

The Product & Technical Specification should describe implementation and system behavior.

Mixing business vision with engineering details makes both documents harder to maintain.

---

## Store the vision inside README

Rejected.

Reason:

README is intended for repository presentation.

It should summarize the project rather than define it.

---

## Keep the vision undocumented

Rejected.

Reason:

The project would gradually lose direction as new features are introduced.

---

# Rationale

Separating product vision from technical specification allows engineering decisions to be evaluated against a stable product strategy.

This creates a stronger foundation for architecture, UX and feature planning.

---

# Related Documents

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md