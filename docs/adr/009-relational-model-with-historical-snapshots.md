# ADR-009 — Relational Model with Historical Snapshots

Status: Accepted

Date: 2026-08-03

---

# Context

Forge manages current training definitions and historical workout execution.

Training plans, workouts, exercises, targets, notes and ordering may change over time.

If completed sessions referenced only the current plan definitions, future edits would rewrite how historical workouts are interpreted and displayed.

Forge also requires:

- user-owned data isolation;
- transactional workout completion;
- idempotent offline synchronization;
- auditable historical corrections;
- reliable relational queries.

---

# Decision

Forge will use PostgreSQL as its primary relational database.

Current training definitions and completed workout history will be separated.

When a workout session starts, Forge creates session-level snapshots of the workout and exercise prescription required to preserve historical meaning.

Completed sessions and completed sets are treated as historical records.

Historical corrections must be explicit and auditable.

Offline-capable writes use client-generated identifiers and idempotent synchronization operations.

---

# Consequences

## Positive

- Future plan edits do not rewrite history.
- Completed sessions remain understandable if source entities are archived.
- Relational constraints enforce important business rules.
- Workout completion can be transactional.
- Offline retries can be handled safely.
- Corrections remain traceable.
- Progress calculations have reliable source records.

## Negative

- Snapshot fields duplicate some plan data.
- Session creation requires additional writes.
- Corrections and recalculations require explicit workflows.
- Offline synchronization adds schema and operational complexity.
- Source definitions and historical records must be kept conceptually separate.

---

# Alternatives Considered

## Reference Current Plan Definitions Only

Rejected.

Reason:

Changes to plans or exercises would alter the interpretation of completed workout history.

---

## Store Entire Sessions as Unstructured JSON

Rejected.

Reason:

This would weaken relational integrity, indexing, validation and progress queries.

JSON may still be used for limited metadata that does not justify a dedicated relational structure.

---

## Copy Complete Training Plans for Every Session

Rejected.

Reason:

This would duplicate more data than necessary and complicate relationships.

Forge will snapshot only the information required to preserve historical meaning.

---

## Allow Direct Historical Editing

Rejected.

Reason:

Silent editing would reduce trust and make derived records difficult to audit.

Corrections must preserve previous values and reasons.

---

# Rationale

Forge depends on trustworthy progress history.

A relational model with execution snapshots balances:

- integrity;
- queryability;
- performance;
- auditability;
- long-term maintainability.

The additional storage cost is acceptable because workout history is central to the product.

---

# Related Documents

- PROJECT-CONSTITUTION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
- DATABASE-SPECIFICATION.md
