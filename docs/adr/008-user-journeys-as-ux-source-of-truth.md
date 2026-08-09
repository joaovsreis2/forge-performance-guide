# ADR-008 — User Journeys as UX Source of Truth

Status: Accepted

Date: 2026-08-04

---

# Context

Forge requires a consistent user experience across authentication, daily activity, workout execution, progress review, recovery tracking and offline behavior.

A page-oriented specification would describe screens but would not adequately define:

- user objectives;
- state transitions;
- alternative paths;
- interruption recovery;
- offline continuity;
- error recovery;
- journey outcomes.

Because Forge is mobile-first and expected to operate during real workout sessions, experience behavior must be defined before visual design and implementation.

---

# Decision

Forge will document user experience through user journeys and system states.

The UX Flow becomes the canonical reference for:

- user objectives;
- entry conditions;
- happy paths;
- alternative flows;
- error states;
- offline behavior;
- exit states;
- journey dependencies.

Visual prototypes must derive from the UX Flow.

Source code must implement the documented outcomes and transitions.

The UX Flow will not define visual styling or database implementation.

---

# Consequences

## Positive

- Product behavior is defined before interface design.
- Alternative and failure paths become explicit.
- Offline continuity is treated as part of the experience.
- Visual design receives clearer constraints.
- AI coding assistants have less room to invent behavior.
- Acceptance testing can derive from documented journeys.
- Navigation decisions become consistent.

## Negative

- Journey changes require documentation maintenance.
- The initial design process requires more preparation.
- Some implementation decisions remain blocked until open product questions are resolved.

---

# Alternatives Considered

## Page-Oriented Documentation

Rejected.

Reason:

A list of screens does not describe user goals, transitions, interruption recovery or alternative flows.

## Prototype as the Only UX Specification

Rejected.

Reason:

Visual prototypes often omit validation, error states, offline behavior and system rules.

## Define UX During Implementation

Rejected.

Reason:

This would allow engineering decisions to determine product behavior without explicit product review.

## Use User Stories Only

Rejected.

Reason:

User stories are useful for planning but insufficient for documenting full journey behavior and state transitions.

---

# Rationale

Forge is used in environments where users have limited attention and unreliable connectivity.

A journey-oriented UX specification provides a stable contract between product, design, engineering and quality assurance.

It also preserves the distinction between:

- what users need to accomplish;
- how the interface looks;
- how the system stores data.

---

# Related Documents

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
