# ADR-010 — Responsible and Auditable Gamification

Status: Accepted

Date: 2026-08-03

---

# Context

Forge uses gamification to reinforce training consistency, progress awareness and recovery behavior.

Fitness gamification can create harmful incentives when it rewards:

- extreme training volume;
- excessive frequency;
- unsafe load increases;
- body-value changes;
- streak preservation at any cost;
- public comparison.

Forge also requires progression values to remain explainable and recoverable after synchronization errors or historical corrections.

---

# Decision

Forge will use responsible, non-punitive and auditable gamification.

The system will include:

- permanent experience;
- deterministic levels;
- Performance, Consistency and Recovery attributes;
- traceable personal records;
- meaningful achievements;
- proportional celebrations;
- reward caps;
- calculation versioning;
- append-only experience ledger entries.

Forge will not use:

- experience loss for inactivity;
- expiring streaks;
- public rankings;
- rewards based directly on body-value change;
- unlimited rewards for excessive activity;
- opaque progression formulas;
- shame-based language.

Every experience event must reference an authoritative source event.

Corrections create audited ledger adjustments rather than silently rewriting reward history.

---

# Consequences

## Positive

- Gamification supports sustainable behavior.
- Users can understand how progression is calculated.
- Duplicate synchronization cannot duplicate rewards.
- Historical corrections remain traceable.
- The model avoids common harmful fitness incentives.
- Product language remains aligned with recovery and long-term consistency.

## Negative

- Reward calculation requires more validation and audit data.
- Some engagement mechanics commonly used by fitness products are intentionally unavailable.
- Attribute formulas require testing and version management.
- Corrections may require recalculation of multiple derived values.
- Reward caps add configuration and edge cases.

---

# Alternatives Considered

## Punitive Streak System

Rejected.

Reason:

Expiring streaks create loss aversion and may pressure users to train when rest is appropriate.

---

## Experience Based on Training Volume Alone

Rejected.

Reason:

This would reward excessive or unsafe activity and disadvantage users with different plans or abilities.

---

## Opaque Engagement Score

Rejected.

Reason:

Users would be unable to understand or trust the result.

---

## Public Leaderboards

Rejected for the MVP.

Reason:

Public comparison conflicts with personal progression, privacy and responsible training principles.

---

## Directly Edit Experience Totals

Rejected.

Reason:

Direct edits remove traceability.

Adjustments must use append-only ledger entries.

---

# Rationale

Forge is designed around long-term personal evolution.

Gamification is valuable only when it reinforces the product's real purpose without replacing it.

A transparent ledger, deterministic formulas and explicit safety limits create a progression system that is trustworthy, testable and compatible with historical corrections.

---

# Related Documents

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
- DATABASE-SPECIFICATION.md
- GAMIFICATION-SPECIFICATION.md
