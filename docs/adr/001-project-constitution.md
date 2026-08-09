# ADR-001 — Project Constitution

Status: Accepted

Date: 2026-08-03

---

## Context

Forge is intended to become a long-term software project.

The project will include multiple documents covering product, architecture, UX, gamification, database design and implementation.

Without a governing document, decisions may become inconsistent over time, especially when different AI assistants or contributors participate in the project.

A single source of truth is required to preserve the project's identity and engineering philosophy.

---

## Decision

A Project Constitution will be introduced as the highest-level project document.

The Constitution defines the immutable principles that govern product, engineering, architecture and design decisions.

Every future document must comply with the Constitution.

Whenever conflicts exist between documents, the Constitution takes precedence.

Changes to the Constitution must be explicitly approved and documented through a new ADR.

---

## Consequences

### Positive

- Consistent engineering decisions.
- Stable product vision.
- Easier onboarding for future contributors.
- Better alignment between documentation and implementation.
- Reduced architectural drift.

### Negative

- Requires additional discipline when changing project direction.
- Major strategic changes become more formal.

---

## Alternatives Considered

### No Constitution

Rejected.

Reason:

Important principles would become scattered across multiple documents.

---

### Store principles inside AGENTS.md

Rejected.

Reason:

AGENTS.md is intended for AI operational guidance.

Project governance should remain independent from AI tooling.

---

### Store principles inside Product & Technical Specification

Rejected.

Reason:

The Product & Technical Specification describes the product.

The Constitution defines the rules that govern the product itself.

They have different responsibilities.

---

## References

- PROJECT-CONSTITUTION.md