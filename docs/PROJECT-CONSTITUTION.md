# PROJECT CONSTITUTION

Status: Approved

Version: 1.0.0

Owner: João Victor

Last Updated: 2026-08-03

---

# Purpose

This document defines the immutable principles that govern every technical, product and design decision made within the Forge project.

Every document, feature, pull request and architectural decision must respect this constitution.

Whenever a conflict exists, this document has priority over every other project document except explicit user decisions.

---

# Mission

Forge exists to help people become stronger through discipline, consistency and measurable progress.

Forge is not a workout tracker.

Forge is a performance platform.

Every feature must reinforce this mission.

---

# Core Philosophy

The product must always prioritize long-term user evolution over short-term engagement.

Training is only one part of the user's journey.

Recovery, consistency, habits and progression are equally important.

---

# Product Principles

## Principle 1 — Evolution First

Every feature must contribute to the user's evolution.

If a feature does not improve the user's journey, it should not exist.

---

## Principle 2 — Simplicity Wins

Always prefer the simplest solution capable of solving the problem.

Complexity must be earned.

---

## Principle 3 — Documentation First

Important decisions must be documented before implementation.

Documentation is the project's source of truth.

---

## Principle 4 — Product Before Technology

Technology exists to serve the product.

Never introduce a technology because it is fashionable.

Every technical decision must solve a real problem.

---

## Principle 5 — Mobile First

The primary experience is mobile.

Desktop is secondary.

All interfaces must be designed considering one-handed usage.

---

## Principle 6 — Offline During Workouts

Workout sessions must continue functioning without internet.

Offline capability is a product requirement.

Not an optional enhancement.

---

## Principle 7 — Performance Over Decoration

Performance always has priority over visual effects.

Animations exist only when they improve understanding.

---

## Principle 8 — Clarity Over Density

Interfaces should present only the information required for the current task.

Avoid visual overload.

---

## Principle 9 — Progress Over Perfection

The system rewards consistency.

It never punishes users for temporary setbacks.

Progress is cumulative.

---

## Principle 10 — Honest Gamification

Gamification exists to reinforce healthy behavior.

Never manipulate users through addictive mechanics.

Never reward spam actions.

Never encourage unsafe training.

---

# Engineering Principles

## Single Source of Truth

Every piece of information should exist in one place only.

Avoid duplicated business rules.

Avoid duplicated documentation.

Avoid duplicated configuration.

---

## Explicit Over Implicit

Code should be obvious.

Hidden behavior is discouraged.

---

## Readability Before Cleverness

Future maintainability is more important than writing fewer lines.

---

## Small Responsibilities

Every module should have a single responsibility.

Every service should solve one business problem.

Every document should answer one category of questions.

---

## Testability

Business rules must be testable.

Code that cannot be tested should be reconsidered.

---

## Incremental Complexity

Never design for imaginary scale.

Solve today's problem while keeping reasonable room for tomorrow.

---

# UX Principles

Users are usually training.

Interfaces must minimize interaction.

The product should disappear while the user trains.

Every screen should have one primary action.

---

# Design Principles

Forge should look like a premium digital product.

Not like a generated admin panel.

Not like a Bootstrap dashboard.

Not like a generic SaaS template.

Typography is more important than cards.

Whitespace is more important than decoration.

Hierarchy is more important than color.

---

# Architecture Principles

The official architecture is a Modular Monolith.

This architecture will remain until a documented reason exists to change it.

Architecture changes require an ADR.

---

# Decision Making

Every important decision must answer:

- What problem are we solving?
- What alternatives exist?
- Why is this solution preferable?
- What are the trade-offs?
- What future impact exists?

---

# Definition of Success

Forge succeeds when users:

- train consistently;
- understand their evolution;
- trust the information;
- feel motivated by progress;
- spend less time operating the application and more time training.

---

# Things Forge Will Never Become

Forge will never become:

- a social network;
- a clone of existing workout apps;
- an engagement-first product;
- a notification spam machine;
- a feature collection without direction.

Every feature must reinforce the original mission.

---

# Constitutional Amendments

This document should change very rarely.

Any modification must be justified through an Architecture Decision Record (ADR).

Constitutional changes require explicit approval.

---

# Final Principle

Whenever uncertainty exists, choose the option that produces the simplest product, the clearest experience and the strongest long-term foundation.