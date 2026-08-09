# PRODUCT & TECHNICAL SPECIFICATION

Status: Approved

Version: 1.0.0

Owner: João Victor

Last Updated: 2026-08-07

Related Documents:

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md

---

# 1. Purpose

This document defines the functional and technical specification of Forge.

Its objective is to describe what the system does, which capabilities it provides, which constraints exist and which principles guide the implementation.

This document intentionally avoids implementation details that belong to source code or framework-specific documentation.

Whenever architectural decisions change, they must be documented through an Architecture Decision Record (ADR).

---

# 2. Product Overview

Forge is a performance platform designed to help users improve their physical performance through structured training, measurable progression and long-term consistency.

Rather than acting as a digital notebook for workouts, Forge provides a unified experience that combines training sessions, progression tracking, recovery monitoring and habit management.

The application is designed around one central idea:

Every interaction should help the user understand their progress and make the next workout easier to execute.

The platform must remain focused, predictable and trustworthy.

---

# 3. Product Goals

Forge has five primary goals.

## Goal 1 — Simplify Training Execution

The application should reduce the cognitive effort required during workouts.

Users should immediately understand:

- today's workout;
- current exercise;
- next action;
- remaining work.

The application should never compete for the user's attention while they are training.

---

## Goal 2 — Measure Real Progress

Forge must transform raw workout data into meaningful progress indicators.

Examples include:

- strength progression;
- personal records;
- consistency;
- training volume;
- recovery trends;
- habit completion.

Numbers without context should be avoided.

---

## Goal 3 — Encourage Long-Term Consistency

Forge rewards consistency rather than isolated performance.

Missing a workout should not erase previous achievements.

The platform should encourage users to return instead of making them feel punished.

---

## Goal 4 — Build User Trust

Every metric presented by Forge must be explainable.

Users should understand:

- where data comes from;
- how values are calculated;
- why recommendations exist.

Hidden calculations should be avoided whenever possible.

---

## Goal 5 — Scale Without Losing Simplicity

The system should support future growth while preserving a simple user experience.

Additional functionality should integrate naturally with existing workflows instead of introducing parallel experiences.

---

# 4. Non Goals

Forge intentionally does not aim to become the following.

## Social Network

Users are not encouraged to publish workouts publicly.

Community features are outside the scope of the initial product.

---

## Entertainment Platform

Gamification exists to reinforce discipline.

It should never replace the actual purpose of training.

---

## Medical Application

Forge does not diagnose injuries, prescribe treatments or replace professional medical advice.

Health-related recommendations should remain informational.

---

## Nutrition Platform

Meal planning and calorie tracking are outside the initial scope.

Future integrations may exist but nutrition is not a core responsibility.

---

## Marketplace

Forge is not intended to become a marketplace for trainers, supplements or fitness products.

Commercial features are outside the MVP.

---

# 5. Product Scope

The first public version of Forge includes the following capabilities.

## Authentication

Users can:

- create an account;
- sign in;
- recover their password;
- manage their profile.

---

## Training

Users can:

- access workout plans;
- execute workouts;
- record completed sets;
- record weight;
- record repetitions;
- record duration;
- record distance when applicable;
- complete workouts.

---

## Progress

Users can:

- review workout history;
- monitor personal records;
- review progression;
- monitor consistency;
- review training statistics.

---

## Recovery

Users can register:

- sleep;
- hydration;
- cardio;
- recovery habits.

---

## Measurements

Users can register body measurements over time.

Historical values must remain available.

---

## Dashboard

The application provides a single dashboard focused on today's activities and recent progress.

---

# 6. Out of Scope

The following capabilities are intentionally excluded from the first version.

- Social feed.
- Public profiles.
- Messaging.
- Team management.
- Subscription billing.
- Smartwatch synchronization.
- AI coaching.
- Meal planning.
- Marketplace.
- Wearable integrations.
- Public rankings.

Future versions may revisit these decisions through ADRs.

---

# 7. Success Criteria

The first version of Forge is considered successful when users can:

- create an account;
- access their training plan;
- complete workouts;
- record workout data;
- review historical progress;
- monitor personal evolution;
- build consistent habits;
- use the application during real workouts without friction.

Technical success is measured through:

- predictable behavior;
- stable performance;
- reliable persistence;
- maintainable architecture;
- clear documentation;
- automated tests.

---

# 8. Product Constraints

Forge must satisfy the following constraints.

## Mobile First

The primary experience is mobile.

Desktop complements the experience.

---

## Offline During Workouts

Workout execution should remain functional even when connectivity is temporarily unavailable.

Synchronization may occur later.

---

## User Ownership

Every user owns their own data.

Users cannot access another user's information.

---

## Historical Integrity

Past workout sessions must never change because future workout plans changed.

Historical data is immutable.

---

## Simplicity

Every new feature increases product complexity.

Complexity must always be justified by measurable user value.

---

# End of Part 1

---

# 9. User Roles

Forge currently defines a single operational role.

Future versions may introduce additional roles through ADRs.

## USER

The User is the owner of the account.

Users can:

- authenticate;
- manage their profile;
- access assigned workout plans;
- execute workouts;
- register workout data;
- review historical information;
- monitor progression;
- register recovery information;
- manage personal settings.

Users cannot access information belonging to other users.

---

# 10. Core Modules

The first version of Forge is composed of five business domains.

## M-001 — Identity

Responsible for:

- authentication;
- authorization;
- user profile;
- account lifecycle;
- preferences.

---

## M-002 — Training

Responsible for:

- workout plans;
- workouts;
- exercises;
- workout execution;
- completed sets;
- training history generation.

---

## M-003 — Progress

Responsible for:

- progression;
- personal records;
- body measurements;
- recovery;
- habits;
- achievements;
- historical analytics.

---

## M-004 — Platform

Responsible for shared platform services.

Examples:

- notifications;
- audit logging;
- configuration;
- feature flags;
- system settings.

Business rules do not belong here.

---

## M-005 — Dashboard

Responsible for presenting the user's current state.

The dashboard aggregates information from every other domain.

It owns no business rules.

---

# 11. Functional Requirements

The following requirements define the minimum functional behavior expected from Forge.

## Authentication

### FR-001

The system shall allow users to create an account.

---

### FR-002

The system shall allow users to authenticate using email and password.

---

### FR-003

The system shall support password recovery.

---

### FR-004

The system shall terminate authenticated sessions securely.

---

## Profile

### FR-005

The system shall allow users to manage their profile.

---

### FR-006

The system shall store physical information required by the platform.

Examples include:

- height;
- weight;
- birth date;
- gender (optional);
- training goal.

---

## Workout Plans

### FR-007

The system shall allow users to access their current workout plan.

---

### FR-008

Each workout plan shall contain one or more workouts.

---

### FR-009

Each workout shall contain one or more exercises.

---

### FR-010

Exercises may define:

- target repetitions;
- target sets;
- target duration;
- target distance;
- rest interval;
- notes.

---

## Workout Execution

### FR-011

Users shall be able to start a workout session.

---

### FR-012

Only one workout session may remain active simultaneously.

---

### FR-013

Users shall be able to register completed sets.

---

### FR-014

Completed sets may contain:

- repetitions;
- weight;
- duration;
- distance;
- perceived effort (future).

---

### FR-015

Users shall be able to complete individual exercises.

---

### FR-016

Users shall be able to complete workout sessions.

---

### FR-017

Workout completion shall generate historical records.

---

## Progress

### FR-018

Users shall be able to review workout history.

---

### FR-019

Users shall be able to review progression history.

---

### FR-020

Users shall be able to review personal records.

---

### FR-021

Users shall be able to review body measurements.

---

### FR-022

Users shall be able to register new measurements.

---

## Recovery

### FR-023

Users shall be able to register recovery habits.

Examples:

- sleep;
- hydration;
- cardio.

---

### FR-024

Recovery information shall become part of historical progression.

---

## Dashboard

### FR-025

The dashboard shall present today's most relevant information.

---

### FR-026

The dashboard shall prioritize actions instead of metrics.

---

# End of Part 2

---

# 12. Business Rules

The following rules define mandatory business behavior.

Every implementation must comply with these rules.

---

## Authentication

### BR-001

Every operation must belong to an authenticated user.

---

### BR-002

Users may only access their own information.

---

### BR-003

User identity must remain unique.

---

## Workout Plans

### BR-004

A workout plan may contain multiple workouts.

---

### BR-005

A workout may contain multiple exercises.

---

### BR-006

Exercises are reusable.

The same exercise may exist in multiple workout plans.

---

## Workout Sessions

### BR-007

A user may have only one active workout session.

---

### BR-008

Workout sessions create immutable historical records.

Future changes to workout plans must never modify completed sessions.

---

### BR-009

Workout sessions may be cancelled before completion.

Cancelled sessions are not considered completed workouts.

---

### BR-010

Completed workout sessions cannot be silently modified.

Administrative changes must be auditable.

---

## Completed Sets

### BR-011

Every completed set must contain meaningful execution data.

At least one of the following must exist:

- repetitions
- weight
- duration
- distance

---

### BR-012

Completed sets belong to exactly one workout session.

---

## Historical Data

### BR-013

Historical records are immutable.

Users may create new records.

Users may not rewrite history.

---

### BR-014

Deleting a workout plan never deletes historical information.

---

### BR-015

Deleting an exercise never removes completed workout history.

---

## Measurements

### BR-016

Measurements represent snapshots in time.

Editing previous measurements is discouraged.

New measurements should be created instead.

---

## Recovery

### BR-017

Recovery information belongs to a specific calendar day.

---

### BR-018

Only one recovery record may exist per day.

Future versions may extend this rule.

---

## Dashboard

### BR-019

The dashboard always prioritizes today's actions.

Historical analytics are secondary.

---

### BR-020

The dashboard should never become a reporting interface.

Detailed analytics belong elsewhere.

---

## Data Integrity

### BR-021

Every important action must be traceable.

---

### BR-022

Business calculations must be deterministic.

The same input must always generate the same output.

---

### BR-023

Business rules must never depend on client-side validation.

Server-side validation is authoritative.

---

# 13. Product Assumptions

The following assumptions guide the current implementation.

PA-001

Users generally follow structured workout plans.

---

PA-002

Most users train using mobile devices.

---

PA-003

Internet connectivity may become unavailable during workouts.

---

PA-004

Users value historical accuracy.

---

PA-005

Consistency is more valuable than isolated performance.

---

# 14. Product Risks

The following risks should be continuously monitored.

PR-001

Feature creep.

---

PR-002

Overcomplicated workout execution.

---

PR-003

Excessive gamification.

---

PR-004

Performance degradation during workouts.

---

PR-005

Loss of historical integrity.

---

# End of Part 3

---

# Domain Model

The following conceptual model describes the primary business entities of Forge.

This section represents business concepts only.

It does not describe database implementation.

---

## Training Domain

User

↓

Training Plan

↓

Workout

↓

Exercise

↓

Workout Session

↓

Completed Set

---

## Progress Domain

User

↓

Progress

├── Personal Records

├── Measurements

├── Recovery

└── Habits

---

## Dashboard Domain

Dashboard

↓

Training Summary

↓

Progress Summary

↓

Recovery Summary

↓

Recommendations

---

Business rules operate over these business concepts.

Database entities may differ from this conceptual model.

---

# 15. System Characteristics

The following characteristics define how Forge should behave as a software product.

These characteristics are independent of implementation details.

---

## SC-001 — Reliability

The platform must provide predictable behavior.

Users should receive the same result for identical actions performed under the same conditions.

Unexpected behavior is considered a defect.

---

## SC-002 — Historical Integrity

Historical information is immutable.

Completed workouts represent facts.

Future modifications must never alter historical records.

---

## SC-003 — Transparency

Every important metric presented to the user must be explainable.

The system should avoid "magic numbers" whose origin cannot be understood.

Whenever calculations exist, they should remain deterministic.

---

## SC-004 — Performance

The platform should minimize the time required to perform common workout actions.

Recording a completed set should require the smallest possible number of interactions.

Performance during active workouts has priority over secondary functionality.

---

## SC-005 — Availability

Temporary internet connection loss should not interrupt active workout sessions.

Synchronization may occur later.

---

## SC-006 — Consistency

Identical business rules must behave consistently across every part of the application.

No feature may implement a different interpretation of the same rule.

---

## SC-007 — Simplicity

Every new feature increases product complexity.

Complexity must always be justified by measurable user value.

Whenever two solutions solve the same problem, the simpler solution should be preferred.

---

## SC-008 — Accessibility

The platform should remain usable by the largest possible number of users.

Interfaces should prioritize:

- readable typography;
- sufficient contrast;
- predictable navigation;
- touch-friendly controls.

Accessibility is considered part of product quality.

---

## SC-009 — Trust

Forge should become a trustworthy source of personal performance data.

Users must feel confident that:

- their data is safe;
- calculations are correct;
- historical information is preserved.

---

## SC-010 — Scalability

The product should support future growth without requiring architectural redesign.

New capabilities should integrate naturally with existing workflows.

---

# 16. Quality Attributes

Forge prioritizes the following quality attributes.

QA-001

Reliability

---

QA-002

Maintainability

---

QA-003

Usability

---

QA-004

Performance

---

QA-005

Security

---

QA-006

Extensibility

---

QA-007

Observability

---

QA-008

Testability

---

# 17. Security Requirements

SR-001

Every request requiring authentication must verify user identity.

---

SR-002

Users may only access their own data.

---

SR-003

Sensitive information must never be exposed to unauthorized users.

---

SR-004

Authentication state must be validated by the server.

---

SR-005

All important user actions should be auditable.

---

SR-006

Input validation must never rely exclusively on client-side validation.

---

SR-007

Security has priority over convenience whenever conflicts exist.

---

# 18. Future Evolution

The first version of Forge intentionally limits its scope.

Future versions may introduce:

- trainer accounts;
- shared workout plans;
- wearable integrations;
- public APIs;
- AI-assisted insights;
- nutrition integrations;
- team management;
- advanced analytics.

Future capabilities must respect the Project Constitution.

---

# 19. Specification Completion

This document defines the official functional specification of Forge version 1.

Implementation details belong to source code and Architecture Decision Records.

Whenever this specification changes, corresponding documentation must be updated.

---

# Glossary

## User

A registered person using Forge.

---

## Training Plan

A structured collection of workouts.

---

## Workout

A scheduled training routine.

---

## Workout Session

One execution of a workout.

---

## Exercise

A physical movement performed during training.

---

## Completed Set

One executed set recorded during a workout session.

---

## Personal Record

The highest validated performance achieved for an exercise.

---

## Recovery

Daily information related to sleep, hydration and physical recovery.

---

## Habit

A daily behavior tracked by the platform.

---

## Progress

The evolution of a user over time.

It combines training, recovery, consistency and measurements.

---

## Dashboard

The entry point of the application.

Its purpose is to answer:

"What should I do now?"

---

# End of Product & Technical Specification
