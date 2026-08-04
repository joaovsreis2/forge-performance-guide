# ROADMAP

Status: Draft

Version: 1.0.0

Owner: João Victor

Last Updated: 2026-08-04

Related Documents:

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
- DATABASE-SPECIFICATION.md
- GAMIFICATION-SPECIFICATION.md
- DESIGN-DIRECTION.md

---

# 1. Purpose

This document defines the implementation roadmap for Forge.

It translates the approved product, UX, database, gamification and design specifications into an ordered delivery plan.

The roadmap is designed to:

- reduce implementation risk;
- preserve architectural consistency;
- keep the MVP focused;
- create demonstrable portfolio milestones;
- provide clear implementation order for human developers and AI coding assistants;
- prevent features from being built before their dependencies exist.

This document defines execution order and completion criteria.

It does not replace the detailed specifications.

---

# 2. Delivery Principles

## RP-001 — Build Vertical Slices

Whenever possible, each phase should deliver a usable end-to-end capability.

Avoid building isolated infrastructure without a visible product outcome.

---

## RP-002 — Foundation Before Features

Core project quality, environment configuration and database integration must exist before major product modules are implemented.

---

## RP-003 — Training Execution Is the Core

The active workout experience is the highest-priority product capability.

Secondary features must not delay a reliable training flow.

---

## RP-004 — Offline Is Not an Afterthought

Offline continuity must be designed into workout execution before the feature is considered complete.

---

## RP-005 — Historical Integrity First

Session snapshots, auditability and idempotency must be implemented before progress and gamification depend on them.

---

## RP-006 — Real Data Before Advanced Analytics

Progress views should use real completed-session data before advanced metrics are introduced.

---

## RP-007 — Responsible Gamification Last

Gamification depends on trustworthy training and progress data.

It must not be implemented before source events are reliable.

---

## RP-008 — Demonstrable Milestones

Each phase should end with something that can be shown, tested and explained in the portfolio.

---

# 3. Project Phases

The initial roadmap is divided into nine phases.

1. Foundation
2. Identity and Onboarding
3. Training Definition
4. Workout Execution
5. Offline and PWA
6. Progress and Recovery
7. Gamification
8. Design Refinement
9. Production Readiness

---

# 4. Phase 1 — Foundation

## Objective

Create a stable project base that supports development, testing and deployment.

## Scope

### Project Setup

- initialize Django project;
- configure environment-based settings;
- configure PostgreSQL;
- configure static and media handling;
- define development and production settings;
- configure application logging;
- configure time zone and localization defaults.

### Development Environment

- create Dockerfile;
- create Docker Compose development environment;
- configure PostgreSQL service;
- configure environment variables;
- create startup commands;
- document local setup.

### Code Quality

- configure Ruff;
- configure formatting rules;
- configure Pytest;
- configure coverage reporting;
- configure pre-commit hooks;
- establish naming and module conventions.

### Continuous Integration

- create GitHub Actions workflow;
- run linting;
- run tests;
- verify migrations;
- verify project startup.

### Initial Django Modules

Create the initial domain-oriented applications:

```text
core
accounts
training
progress
```

Additional applications should only be created when a clear domain boundary exists.

## Deliverables

- Django project starts locally;
- PostgreSQL connection works;
- Docker development environment works;
- test suite runs;
- linting runs;
- CI passes;
- environment setup is documented.

## Acceptance Criteria

- a new developer can start the project using documented commands;
- no secrets are committed;
- production and development settings are separated;
- PostgreSQL is used in integration testing;
- the repository passes CI from a clean checkout.

## Portfolio Demonstration

Show:

- repository structure;
- Docker setup;
- CI workflow;
- test execution;
- architecture documentation.

---

# 5. Phase 2 — Identity and Onboarding

## Objective

Allow users to create accounts, authenticate and complete minimum onboarding.

## Scope

### Authentication

- custom user model using email as identity;
- account registration;
- sign in;
- sign out;
- password recovery;
- password reset;
- secure session management.

### User Profile

- display name;
- birth date when required;
- height;
- current weight;
- training goal;
- onboarding status.

### User Preferences

- time zone;
- weight unit;
- distance unit;
- appearance preference;
- rest timer sound;
- rest timer vibration.

### Onboarding

Implement the documented first-time-user journey:

```text
Create Account
↓
Profile Setup
↓
Training Goal
↓
Physical Information
↓
Plan Setup Status
↓
Today
```

### Authorization

- enforce user ownership;
- prevent cross-user access;
- add authorization tests.

## Deliverables

- complete authentication flow;
- profile management;
- preference management;
- onboarding completion;
- initial Today placeholder state.

## Acceptance Criteria

- users can register and authenticate;
- password recovery works;
- users cannot access another user's data;
- onboarding resumes from the first incomplete step;
- optional fields are clearly identified;
- authentication tests pass.

## Portfolio Demonstration

Show:

- registration;
- onboarding;
- sign in;
- profile;
- secure password recovery;
- mobile-first forms.

---

# 6. Phase 3 — Training Definition

## Objective

Create the training-plan structure required for workout execution.

## Scope

### Exercise Catalog

- exercise entity;
- primary metric;
- instructions;
- default rest interval;
- archive behavior.

### Training Plans

- training plan;
- plan workout;
- workout exercise prescription;
- plan status lifecycle;
- one active plan per user.

### Administration

- Django admin for exercises;
- Django admin for plans;
- plan assignment;
- plan activation;
- plan archival.

### Spreadsheet Import

Implement the first controlled import path for the user's workout spreadsheet.

The import process should support:

- source file validation;
- row-level errors;
- dry-run preview;
- exercise matching;
- workout creation;
- sequence preservation;
- technical notes;
- sets;
- repetitions;
- rest intervals;
- import summary.

The first version may use an administrative command or protected admin workflow.

### Today Integration

Today should display:

- active plan status;
- scheduled workout;
- no-plan state;
- rest-day state.

## Deliverables

- exercise catalog;
- training plan structure;
- admin management;
- spreadsheet import;
- active plan shown in Today.

## Acceptance Criteria

- plans preserve workout and exercise ordering;
- only one active plan exists per user;
- imported invalid data is reported clearly;
- plan archival does not remove historical references;
- users can view their current plan;
- users cannot edit plans in the MVP.

## Portfolio Demonstration

Show:

- spreadsheet import;
- admin plan assignment;
- plan overview;
- Today with scheduled workout.

---

# 7. Phase 4 — Workout Execution

## Objective

Deliver the complete online workout flow.

## Scope

### Workout Session Creation

- prevent duplicate active sessions;
- create workout snapshot;
- create exercise snapshots;
- preserve targets, notes and ordering;
- create active-session state.

### Active Workout

- current exercise;
- current set;
- target values;
- previous relevant performance;
- numeric inputs;
- complete-set action;
- skip-set action;
- skip-exercise action;
- workout progress.

### Rest Timer

- automatic start after completed set;
- elapsed-time-based countdown;
- continue early;
- sound and vibration preferences;
- background-safe behavior where possible.

### Session Lifecycle

- active;
- paused;
- resumed;
- completed;
- cancelled.

### Completion

- validate meaningful data;
- preserve skipped items;
- calculate duration;
- create final summary;
- protect against duplicate completion.

### Historical Integrity

- completed sessions become snapshots;
- plan changes do not alter completed sessions;
- corrections use explicit audit behavior.

## Deliverables

- workout preview;
- active workout;
- completed sets;
- rest timer;
- pause and resume;
- cancel flow;
- workout summary;
- initial training history.

## Acceptance Criteria

- only one active or paused session exists per user;
- repeated taps do not duplicate sets;
- completed sets require meaningful data;
- cancelled sessions remain traceable;
- completed sessions cannot return to active;
- plan edits do not affect history;
- core workout flow works on mobile.

## Portfolio Demonstration

Show the complete flow:

```text
Today
↓
Workout Preview
↓
Active Exercise
↓
Complete Set
↓
Rest Timer
↓
Next Exercise
↓
Workout Summary
```

---

# 8. Phase 5 — Offline and PWA

## Objective

Allow active workouts to continue safely during temporary connectivity loss.

## Scope

### PWA Foundation

- web app manifest;
- installable application behavior;
- service worker;
- application shell caching;
- offline fallback.

### Workout Caching

Cache the complete required structure for:

- current plan;
- selected workout;
- active session;
- exercise notes;
- existing completed sets.

### Local Persistence

Use a browser storage mechanism appropriate for structured offline data.

Recommended:

```text
IndexedDB
```

Store:

- client-generated IDs;
- session state;
- completed sets;
- timer reference timestamps;
- pending operations;
- synchronization status.

### Synchronization

- idempotency keys;
- safe retries;
- duplicate prevention;
- pending state;
- syncing state;
- failed state;
- conflict state;
- server confirmation.

### Authentication Expiration

- preserve local workout data;
- request reauthentication when synchronization requires it;
- continue local session when safe.

### Conflict Handling

- preserve local data;
- reject stale terminal-state reversals;
- record conflict resolution;
- avoid silent overwrites.

## Deliverables

- installable PWA;
- cached workout;
- offline set recording;
- offline pause and resume;
- offline completion;
- automatic synchronization;
- visible sync states.

## Acceptance Criteria

- connection loss does not interrupt an active cached workout;
- local data survives application restart;
- retries do not duplicate sets;
- offline completion remains visible as successful;
- local data is deleted only after server confirmation;
- synchronization failures provide recovery actions;
- stale clients cannot reactivate completed or cancelled sessions.

## Portfolio Demonstration

Show:

- disconnecting the network;
- completing sets offline;
- closing and reopening the app;
- resuming the session;
- reconnecting;
- automatic synchronization.

---

# 9. Phase 6 — Progress and Recovery

## Objective

Turn completed workout data into understandable historical progress.

## Scope

### Training History

- session list;
- completion status;
- duration;
- exercise detail;
- completed sets;
- skipped work;
- cancellation state;
- synchronization state.

### Exercise Progress

- latest performance;
- historical trend;
- compatible metric visualization;
- textual chart summaries;
- personal-record history.

### Personal Records

- supported record types;
- source-set traceability;
- deterministic validation;
- estimated one-repetition maximum when appropriate;
- calculation versioning.

### Recovery

- one recovery record per day;
- sleep;
- hydration;
- cardio or approved recovery behavior;
- current-day editing;
- historical view.

### Habits

- habit definition;
- daily entries;
- completion states;
- archival;
- historical continuity.

### Body Measurements

- one snapshot per day;
- weight;
- optional measurements;
- current-day update;
- historical trend.

### Historical Corrections

- user-authorized corrections;
- previous value;
- new value;
- reason;
- audit event;
- dependent recalculation.

## Deliverables

- Progress overview;
- training history;
- session detail;
- exercise progress;
- personal records;
- recovery entry;
- habits;
- body measurements;
- audit-aware correction flow.

## Acceptance Criteria

- every record references authoritative source data;
- incompatible metrics are not compared;
- charts include text alternatives;
- daily uniqueness rules are enforced;
- corrections preserve previous values;
- measurement changes do not receive value-based judgment;
- Progress does not become a generic KPI dashboard.

## Portfolio Demonstration

Show:

- exercise progression;
- personal record source;
- training history;
- recovery entry;
- measurement history;
- historical correction audit.

---

# 10. Phase 7 — Gamification

## Objective

Introduce transparent, responsible progression after authoritative source data is reliable.

## Scope

### Experience Ledger

- append-only experience events;
- source-event uniqueness;
- calculation version;
- correction adjustments;
- recent XP history.

### Level Progression

Implement:

```text
XP required for level N = 100 × N × (N - 1)
```

### Experience Sources

- workout completion;
- completed exercise;
- completed set;
- personal record;
- weekly consistency;
- recovery registration;
- habit completion;
- measurement snapshot.

### Caps

- daily XP cap;
- set reward cap;
- habit cap;
- recovery cap;
- measurement cap.

### Attributes

- Performance;
- Consistency;
- Recovery;
- confidence level;
- rolling periods;
- explainable contributing data.

### Achievements

- deterministic catalog;
- source traceability;
- unique awards;
- safe milestone definitions.

### Presentation

- recent experience sources;
- level progress;
- restrained celebration;
- clear attribute explanations;
- non-punitive language.

## Deliverables

- experience ledger;
- level;
- attributes;
- achievements;
- personal-record celebration;
- weekly consistency recognition;
- gamification detail view.

## Acceptance Criteria

- duplicate events do not duplicate XP;
- cancelled workouts do not award completion XP;
- levels derive from ledger totals;
- attribute formulas are versioned;
- low-confidence data is identified;
- no mechanic rewards unsafe behavior;
- inactivity does not remove permanent progress;
- gamification remains secondary to real training metrics.

## Portfolio Demonstration

Show:

- workout XP breakdown;
- level progression;
- new personal record;
- achievement;
- Performance, Consistency and Recovery explanation;
- duplicate-event prevention.

---

# 11. Phase 8 — Design Refinement

## Objective

Apply the complete visual direction and ensure experience quality across devices and states.

## Scope

### Design System

- typography;
- spacing;
- colors;
- surfaces;
- borders;
- icons;
- buttons;
- inputs;
- status badges;
- navigation;
- workout components;
- charts;
- modal and bottom sheet;
- offline and sync indicators.

### Themes

- dark theme;
- light theme;
- theme persistence;
- equivalent contrast and functionality.

### Responsive Design

- mobile;
- tablet;
- desktop;
- one-hand workout interaction;
- content-width control.

### System States

- loading;
- empty;
- error;
- permission denied;
- offline;
- pending sync;
- sync failed;
- success.

### Motion

- micro-interactions;
- workout transitions;
- milestone celebration;
- reduced-motion support.

### Accessibility

- WCAG 2.2 AA;
- keyboard navigation;
- visible focus;
- screen-reader labels;
- semantic structure;
- touch targets;
- accessible chart summaries;
- non-color state communication.

### Content Review

- calm language;
- no guilt-based messaging;
- consistent terminology;
- clear action labels.

## Deliverables

- internal design system;
- complete themes;
- responsive screen coverage;
- accessibility review;
- state inventory;
- polished portfolio flows.

## Acceptance Criteria

- the product does not resemble a generic AI-generated dashboard;
- the primary action is obvious on each critical state;
- active workout works comfortably with one hand;
- all critical states exist;
- contrast requirements pass;
- reduced-motion behavior works;
- desktop layouts preserve the mobile hierarchy;
- gamification does not dominate real progress.

## Portfolio Demonstration

Show a polished walkthrough across:

- onboarding;
- Today;
- active workout;
- offline state;
- summary;
- progress;
- gamification;
- profile;
- mobile and desktop.

---

# 12. Phase 9 — Production Readiness

## Objective

Prepare Forge for reliable public deployment and portfolio presentation.

## Scope

### Security

- production secret management;
- secure cookies;
- CSRF protection;
- authentication hardening;
- rate limiting where appropriate;
- security headers;
- dependency review;
- authorization review;
- sensitive-log review.

### Performance

- query optimization;
- active-workout query review;
- index verification;
- static asset optimization;
- caching where justified;
- page-performance measurement.

### Observability

- structured logs;
- error monitoring;
- health checks;
- synchronization failure monitoring;
- audit-event review;
- operational dashboard when useful.

### Database Operations

- automated backups;
- restoration test;
- migration runbook;
- retention policy;
- account deletion process.

### Deployment

- production Docker image;
- application server;
- reverse proxy where required;
- PostgreSQL;
- static asset delivery;
- HTTPS;
- domain;
- deployment documentation.

### Quality Assurance

- end-to-end critical journey tests;
- accessibility testing;
- cross-browser testing;
- mobile-device testing;
- offline testing;
- multi-device synchronization testing;
- security testing;
- regression suite.

### Portfolio

- polished README;
- architecture overview;
- screenshots;
- product walkthrough;
- demo account or safe demo mode;
- technical decisions summary;
- deployment link.

## Deliverables

- production deployment;
- monitoring;
- backup and recovery process;
- security review;
- end-to-end suite;
- portfolio documentation;
- demonstration environment.

## Acceptance Criteria

- critical journeys pass end-to-end tests;
- backups are restorable;
- migrations are documented;
- secrets are protected;
- production errors are observable;
- authorization isolation is verified;
- offline and synchronization behavior is tested;
- accessibility review is complete;
- deployment is reproducible;
- portfolio presentation accurately reflects the implemented product.

---

# 13. MVP Boundary

The MVP includes:

- authentication;
- onboarding;
- administrator or spreadsheet-assigned training plan;
- Today;
- workout execution;
- rest timer;
- pause and resume;
- cancellation;
- workout completion;
- offline cached workout execution;
- synchronization;
- training history;
- exercise progress;
- personal records;
- recovery;
- habits;
- body measurements;
- XP;
- levels;
- attributes;
- achievements;
- dark and light themes;
- responsive design;
- production deployment.

The MVP does not include:

- social feed;
- public profiles;
- messaging;
- trainer marketplace;
- subscription billing;
- wearable integration;
- smartwatch synchronization;
- nutrition planning;
- public leaderboards;
- AI coaching;
- user-created training plans;
- exercise replacement;
- public API.

---

# 14. Dependency Map

```text
Foundation
└── Identity and Onboarding
    └── Training Definition
        └── Workout Execution
            ├── Offline and PWA
            └── Progress and Recovery
                └── Gamification
                    └── Design Refinement
                        └── Production Readiness
```

Some design work may occur continuously, but final design refinement depends on complete product states.

---

# 15. Recommended Implementation Order

Within each phase, use the following order:

1. define or confirm business behavior;
2. create database migration;
3. implement server-side model and validation;
4. implement domain workflow;
5. implement authorization;
6. add tests;
7. implement server-rendered interface;
8. add HTMX interaction where valuable;
9. add client-side behavior where required;
10. test mobile behavior;
11. update documentation;
12. create demonstration evidence.

---

# 16. Codex Execution Rules

When using Codex or another AI coding assistant:

- request one bounded task at a time;
- name the relevant phase;
- reference the exact specification sections;
- require tests;
- require migration review;
- require ownership enforcement;
- require documentation updates when behavior changes;
- reject speculative features;
- do not allow silent architecture changes;
- inspect generated code before accepting it;
- run the full quality suite after each meaningful change.

Example task format:

```text
Implement Phase 2 authentication registration.

Read:
- AGENTS.md
- docs/PROJECT-CONSTITUTION.md
- docs/PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- docs/UX-FLOW.md
- docs/DATABASE-SPECIFICATION.md
- docs/ROADMAP.md

Scope:
- custom email-based user model
- registration form
- registration view
- authentication tests
- ownership-safe defaults

Do not implement onboarding yet.
Do not add external dependencies without justification.
```

---

# 17. Milestone Strategy

## Milestone 1 — Project Boots

Completed after Phase 1.

Demonstrates engineering foundation.

## Milestone 2 — User Enters Forge

Completed after Phase 2.

Demonstrates authentication and onboarding.

## Milestone 3 — Plan Is Ready

Completed after Phase 3.

Demonstrates plan import and Today.

## Milestone 4 — First Workout Completed

Completed after Phase 4.

Demonstrates the core product.

## Milestone 5 — Workout Survives Offline

Completed after Phase 5.

Demonstrates technical differentiation.

## Milestone 6 — Progress Becomes Visible

Completed after Phase 6.

Demonstrates product value over time.

## Milestone 7 — Progression System Works

Completed after Phase 7.

Demonstrates responsible gamification.

## Milestone 8 — Product Feels Finished

Completed after Phase 8.

Demonstrates design quality.

## Milestone 9 — Public Release

Completed after Phase 9.

Demonstrates production readiness.

---

# 18. Testing Strategy by Phase

## Phase 1

- startup;
- settings;
- database;
- CI.

## Phase 2

- authentication;
- onboarding state;
- ownership;
- password recovery.

## Phase 3

- plan constraints;
- ordering;
- import validation;
- activation transaction.

## Phase 4

- active-session uniqueness;
- snapshot integrity;
- set idempotency;
- lifecycle transitions;
- completion transaction.

## Phase 5

- local persistence;
- retries;
- duplicate prevention;
- conflicts;
- restart recovery.

## Phase 6

- history;
- records;
- daily uniqueness;
- corrections;
- calculations.

## Phase 7

- reward uniqueness;
- caps;
- levels;
- attributes;
- achievements;
- corrections.

## Phase 8

- accessibility;
- responsive layouts;
- visual states;
- reduced motion.

## Phase 9

- end-to-end;
- security;
- performance;
- backup restoration;
- deployment.

---

# 19. Documentation Updates

At the end of each phase, update:

- README.md;
- ROADMAP.md;
- affected specifications;
- relevant ADRs;
- setup instructions;
- test instructions;
- portfolio screenshots when useful.

Do not create an ADR for routine implementation details.

Create or update an ADR only when a consequential architectural decision is made.

---

# 20. Release Strategy

## Internal Development Releases

Use small phase-based releases.

Recommended tags:

```text
v0.1.0-foundation
v0.2.0-identity
v0.3.0-training-definition
v0.4.0-workout-execution
v0.5.0-offline
v0.6.0-progress
v0.7.0-gamification
v0.8.0-design
v1.0.0
```

Tag naming may be simplified later.

## Version 1.0.0

Version 1.0.0 is reached only when:

- all MVP capabilities are implemented;
- production readiness criteria pass;
- critical documentation reflects reality;
- the deployed product is stable enough for demonstration.

---

# 21. Risk Register

## RISK-001 — Documentation Without Delivery

Mitigation:

Begin Phase 1 immediately after this roadmap is approved.

## RISK-002 — Offline Complexity

Mitigation:

Implement online workout execution first, but design identifiers and transactions for offline behavior from the beginning.

## RISK-003 — Spreadsheet Import Variability

Mitigation:

Use strict templates, validation and dry runs.

## RISK-004 — Historical Model Complexity

Mitigation:

Implement snapshots and transaction tests before analytics.

## RISK-005 — Gamification Scope Growth

Mitigation:

Use only approved events, caps and achievements.

## RISK-006 — Visual Overdesign

Mitigation:

Follow DESIGN-DIRECTION.md and prioritize active-workout usability.

## RISK-007 — AI-Generated Code Drift

Mitigation:

Use bounded tasks, specification references, tests and manual review.

## RISK-008 — Portfolio Never Reaches Deployment

Mitigation:

Treat each phase as a demonstrable milestone and keep non-MVP features deferred.

---

# 22. Immediate Next Actions

After approving this roadmap:

1. mark completed documentation as Approved;
2. verify README links to all specifications and ADRs;
3. create the Phase 1 implementation branch;
4. initialize the Django project;
5. configure PostgreSQL and environment settings;
6. configure Pytest and Ruff;
7. create the initial CI workflow;
8. commit the working foundation;
9. begin Phase 2 only after Phase 1 acceptance criteria pass.

---

# 23. Definition of Done

The initial roadmap is complete when:

- implementation phases are ordered;
- dependencies are explicit;
- MVP boundaries are clear;
- every phase has deliverables;
- every phase has acceptance criteria;
- testing expectations are defined;
- portfolio milestones are defined;
- immediate next actions are clear.

---

# 24. Roadmap Completion

This roadmap defines the initial delivery plan for Forge version 1.

The roadmap may evolve as implementation reveals new information.

Changes must:

- preserve the Project Constitution;
- respect approved product scope;
- identify affected dependencies;
- avoid silently expanding the MVP;
- update acceptance criteria when necessary.

---

# End of Roadmap
