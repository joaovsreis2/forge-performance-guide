# ADR-005 — Business Rules as Source of Truth

Status: Accepted

Date: 2026-08-03

---

# Context

Business rules define the expected behavior of the product independently of implementation details.

Keeping business rules embedded inside source code makes onboarding, documentation and architectural evolution significantly harder.

A dedicated specification is required.

---

# Decision

Business rules will be documented explicitly inside the Product & Technical Specification.

The specification becomes the canonical reference for expected product behavior.

Source code must implement these rules rather than define them.

---

# Consequences

## Positive

- Clear separation between product behavior and implementation.
- Easier onboarding.
- Better automated testing.
- Stable documentation.

## Negative

- Documentation must evolve together with business rules.

---

# Alternatives Considered

## Define business rules only in source code

Rejected.

Reason:

Business logic becomes difficult to discover and review.

---

## Define business rules only in ADRs

Rejected.

Reason:

ADRs describe architectural decisions, not complete product behavior.

---

# Rationale

Explicit business rules create a stable contract between product, engineering and quality assurance.

---

# Related Documents

- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- PROJECT-CONSTITUTION.md