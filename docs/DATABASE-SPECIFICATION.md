# DATABASE SPECIFICATION

Status: Draft

Version: 1.0.0

Owner: João Victor

Last Updated: 2026-08-03

Related Documents:

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
- GAMIFICATION-SPECIFICATION.md

---

# 1. Purpose

This document defines the official database specification for Forge.

It describes:

- data ownership;
- core entities;
- relationships;
- historical integrity;
- audit requirements;
- offline synchronization requirements;
- deletion behavior;
- indexing expectations;
- data validation boundaries;
- retention principles.

This document is implementation-oriented, but it does not define final Django model code or database migrations.

The source code must implement the concepts and constraints defined here.

---

# 2. Database Principles

## DBP-001 — User-Owned Data

Every user-owned record must be associated with exactly one authenticated user, directly or through a parent entity.

Queries involving user-owned data must always enforce ownership.

---

## DBP-002 — Historical Integrity

Completed workout data represents historical fact.

Changes to current plans, workouts or exercises must not modify completed session history.

---

## DBP-003 — Snapshot-Based History

Historical records must preserve the values that were valid at the time of execution.

Where necessary, session records store snapshots of:

- workout names;
- exercise names;
- targets;
- notes;
- units;
- ordering;
- rest intervals.

---

## DBP-004 — Explicit Lifecycle

Entities must use explicit statuses instead of inferring lifecycle only from null values.

Examples:

- draft;
- active;
- completed;
- cancelled;
- archived;
- pending synchronization;
- failed synchronization.

---

## DBP-005 — Safe Deletion

Business records should prefer archival or soft deletion when physical deletion could damage historical integrity.

---

## DBP-006 — Server Authority

The server is authoritative for validated business data.

Offline clients may create temporary local records that are synchronized later.

---

## DBP-007 — Idempotent Synchronization

Every offline-capable write must support safe retries without creating duplicate records.

---

## DBP-008 — Traceability

Meaningful corrections, administrative actions and synchronization conflicts must be traceable.

---

## DBP-009 — Minimal Sensitive Data

Forge must store only the personal and physical information required for product functionality.

---

## DBP-010 — Deterministic Calculations

Stored derived values must either:

- be reproducible from source data; or
- record the calculation version used.

---

# 3. Database Technology

Forge uses PostgreSQL as the primary relational database.

The database must support:

- relational integrity;
- transactional writes;
- unique constraints;
- check constraints;
- partial indexes;
- JSON fields only where relational structure would be inappropriate;
- timestamp-aware data;
- reliable concurrent writes.

SQLite may be used only for isolated development or tests when behavior remains compatible with PostgreSQL.

Production behavior must be validated against PostgreSQL.

---

# 4. Naming Conventions

## Tables

Use lowercase snake_case names.

Examples:

```text
users
training_plans
workout_sessions
completed_sets
body_measurements
```

## Primary Keys

Use a stable opaque identifier.

Recommended:

```text
UUID
```

Public URLs must not expose sequential assumptions.

## Foreign Keys

Use the singular referenced entity followed by `_id`.

Examples:

```text
user_id
workout_id
workout_session_id
exercise_id
```

## Timestamps

Standard lifecycle fields:

```text
created_at
updated_at
```

Historical and workflow-specific timestamps must be explicit:

```text
started_at
completed_at
cancelled_at
recorded_at
scheduled_for
synced_at
deleted_at
```

## Boolean Fields

Boolean names must read as true-or-false statements.

Examples:

```text
is_active
is_archived
is_verified
```

Do not use ambiguous names such as:

```text
status_flag
active_value
```

## Status Fields

Status values must use lowercase machine-readable identifiers.

Example:

```text
draft
active
completed
cancelled
archived
```

---

# 5. Time, Dates and Time Zones

All timestamp fields must be stored in UTC.

The user's configured IANA time zone determines:

- calendar-day boundaries;
- scheduled workout dates;
- recovery record dates;
- measurement dates;
- daily consistency calculations.

Date-only business concepts should use a date field rather than a timestamp.

Examples:

```text
scheduled_for
recovery_date
measurement_date
```

A time zone change must not rewrite historical timestamps.

---

# 6. Units and Numeric Precision

## Weight

Store weight using decimal values.

Recommended base unit:

```text
kilograms
```

The interface may display converted units later.

## Distance

Store distance in a defined base unit.

Recommended base unit:

```text
meters
```

## Duration

Store durations as integer seconds.

## Body Measurements

Store body dimensions in centimeters.

## Percentages

Store percentages as decimal numeric values, not floating-point approximations.

## Repetitions and Sets

Store repetitions and sequence numbers as non-negative integers.

## Validation

Numeric values must use database-level check constraints where practical.

Examples:

- weight must be greater than or equal to zero;
- repetitions must be greater than or equal to zero;
- duration must be greater than or equal to zero;
- distance must be greater than or equal to zero;
- ordering values must be greater than zero.

---

# 7. Entity Overview

The initial database contains the following core entities.

## Identity

- User
- UserProfile
- UserPreference

## Training Definition

- Exercise
- TrainingPlan
- PlanWorkout
- WorkoutExercise

## Training Execution

- WorkoutSession
- SessionExercise
- CompletedSet
- SessionNote

## Progress

- PersonalRecord
- DailyRecovery
- HabitDefinition
- HabitEntry
- BodyMeasurement

## Gamification

- ExperienceLedger
- UserProgression
- Achievement
- UserAchievement

## Platform

- AuditEvent
- SyncOperation
- DataCorrection

---

# 8. Identity Domain

# 8.1 User

Represents the authenticated account.

## Required Fields

```text
id
email
password_hash
is_active
is_staff
is_superuser
created_at
updated_at
last_login_at
```

## Constraints

- email must be unique after normalization;
- email must be indexed;
- inactive users cannot create authenticated business writes;
- authentication credentials must not be stored outside the authentication boundary.

## Ownership

The User is the root owner of personal Forge data.

---

# 8.2 UserProfile

Stores user information used by the product.

## Suggested Fields

```text
id
user_id
display_name
birth_date
height_cm
current_weight_kg
training_goal
onboarding_status
created_at
updated_at
```

## Constraints

- exactly one profile per user;
- physical values must be validated;
- optional demographic data must remain optional unless product requirements explicitly change.

## Notes

Current weight may be cached here for convenience, but historical weight belongs to BodyMeasurement.

The authoritative historical record is the measurement history.

---

# 8.3 UserPreference

Stores user-configurable application behavior.

## Suggested Fields

```text
id
user_id
timezone
weight_unit
distance_unit
appearance
rest_timer_sound_enabled
rest_timer_vibration_enabled
workout_reminders_enabled
created_at
updated_at
```

## Constraints

- exactly one preference record per user;
- timezone must use an IANA time zone identifier;
- unit values must use controlled choices.

---

# 9. Training Definition Domain

# 9.1 Exercise

Represents a reusable exercise definition.

## Suggested Fields

```text
id
name
slug
description
instructions
primary_metric
default_rest_seconds
is_active
created_at
updated_at
archived_at
```

## Primary Metric Values

Possible values:

```text
repetitions
weight_repetitions
duration
distance
distance_duration
```

## Constraints

- name must not be empty;
- slug must be unique when used publicly;
- archived exercises remain available to historical records;
- exercise deletion must never remove completed history.

## Ownership

For the MVP, exercises may be platform-managed.

Future user-created or trainer-created exercises may add ownership fields.

---

# 9.2 TrainingPlan

Represents a structured plan assigned to one user.

## Suggested Fields

```text
id
user_id
name
description
status
source_type
source_reference
starts_on
ends_on
created_at
updated_at
activated_at
archived_at
```

## Status Values

```text
draft
active
completed
archived
```

## Source Type Values

```text
admin
spreadsheet_import
system
```

## Constraints

- only one active plan per user in the MVP;
- archived plans remain readable;
- deleting or archiving a plan must not affect historical sessions;
- activation must be transactional.

---

# 9.3 PlanWorkout

Represents one workout inside a training plan.

## Suggested Fields

```text
id
training_plan_id
name
description
sequence
weekday
estimated_duration_minutes
is_active
created_at
updated_at
```

## Constraints

- sequence must be unique inside the training plan;
- sequence must be greater than zero;
- weekday is optional;
- plan workouts do not represent completed user activity.

---

# 9.4 WorkoutExercise

Represents an exercise prescription inside a plan workout.

## Suggested Fields

```text
id
plan_workout_id
exercise_id
sequence
target_sets
target_repetitions_min
target_repetitions_max
target_weight_kg
target_duration_seconds
target_distance_meters
rest_seconds
technical_notes
created_at
updated_at
```

## Constraints

- sequence must be unique inside the plan workout;
- target_sets must be greater than zero;
- repetition minimum must not exceed repetition maximum;
- target fields depend on the exercise metric;
- technical notes may override or complement exercise instructions.

## Important Rule

This entity defines the current prescription.

Completed sessions must not depend on its future values.

---

# 10. Training Execution Domain

# 10.1 WorkoutSession

Represents one user execution of a workout.

## Suggested Fields

```text
id
client_generated_id
user_id
training_plan_id
plan_workout_id
status
scheduled_for
started_at
paused_at
completed_at
cancelled_at
duration_seconds
workout_name_snapshot
workout_description_snapshot
source_revision
sync_status
created_at
updated_at
```

## Status Values

```text
active
paused
completed
cancelled
```

## Sync Status Values

```text
synced
pending
syncing
conflict
failed
```

## Constraints

- one user may have only one active or paused session;
- client_generated_id must be unique per user;
- completed_at is required when status is completed;
- cancelled_at is required when status is cancelled;
- completed and cancelled sessions cannot return to active;
- duration must never be negative.

## Historical Snapshot

The session stores the workout identity visible at execution time.

This prevents later plan changes from rewriting history.

---

# 10.2 SessionExercise

Represents the exercise snapshot inside one workout session.

## Suggested Fields

```text
id
workout_session_id
source_workout_exercise_id
source_exercise_id
sequence
status
exercise_name_snapshot
exercise_instructions_snapshot
technical_notes_snapshot
primary_metric_snapshot
target_sets_snapshot
target_repetitions_min_snapshot
target_repetitions_max_snapshot
target_weight_kg_snapshot
target_duration_seconds_snapshot
target_distance_meters_snapshot
rest_seconds_snapshot
started_at
completed_at
skipped_at
created_at
updated_at
```

## Status Values

```text
pending
active
completed
skipped
```

## Constraints

- sequence must be unique inside the session;
- snapshot fields remain unchanged after session creation except through an auditable correction;
- source foreign keys may be nullable to preserve history if source definitions are archived;
- completed session exercises cannot return to active.

---

# 10.3 CompletedSet

Represents one executed set.

## Suggested Fields

```text
id
client_generated_id
workout_session_id
session_exercise_id
set_number
status
repetitions
weight_kg
duration_seconds
distance_meters
perceived_effort
completed_at
sync_status
created_at
updated_at
```

## Status Values

```text
completed
skipped
```

## Constraints

- client_generated_id must be unique per user or session;
- set_number must be greater than zero;
- set_number must be unique inside the session exercise;
- at least one meaningful performance value must exist for a completed set;
- numeric values must not be negative;
- repeated synchronization must not create duplicate sets.

## Meaningful Performance Values

At least one of:

```text
repetitions
weight_kg
duration_seconds
distance_meters
```

must be present for status `completed`.

---

# 10.4 SessionNote

Stores optional notes associated with a session or session exercise.

## Suggested Fields

```text
id
workout_session_id
session_exercise_id
user_id
content
created_at
updated_at
```

## Constraints

- session_exercise_id may be null for a workout-level note;
- the note must belong to the same user and session;
- corrections to notes after session completion should remain auditable when material.

---

# 11. Progress Domain

# 11.1 PersonalRecord

Represents a validated personal performance record.

## Suggested Fields

```text
id
user_id
exercise_id
completed_set_id
record_type
value_numeric
secondary_value_numeric
achieved_at
calculation_version
is_current
created_at
```

## Record Type Values

Examples:

```text
maximum_weight
maximum_repetitions
maximum_distance
longest_duration
estimated_one_rep_max
highest_volume
```

## Constraints

- every record must reference source execution data;
- records cannot exist without a completed set;
- only one current record may exist per user, exercise and record type;
- calculated records must store a calculation version;
- recalculation must not silently erase historical achievements.

---

# 11.2 DailyRecovery

Represents recovery information for one user and one calendar date.

## Suggested Fields

```text
id
client_generated_id
user_id
recovery_date
sleep_minutes
hydration_ml
cardio_completed
recovery_score
notes
sync_status
created_at
updated_at
```

## Constraints

- one record per user and recovery_date;
- recovery_date follows the user's configured time zone;
- optional values may remain null;
- recovery_score must be explainable and versioned if calculated;
- updating today's record is allowed;
- historical correction policy must be auditable when required.

---

# 11.3 HabitDefinition

Represents a habit tracked by a user.

## Suggested Fields

```text
id
user_id
name
description
frequency
target_value
unit
is_active
created_at
updated_at
archived_at
```

## Constraints

- archived habits remain visible in historical entries;
- habit names need only be unique per user when product rules require it;
- frequency uses controlled choices.

---

# 11.4 HabitEntry

Represents one habit result on one date.

## Suggested Fields

```text
id
client_generated_id
habit_definition_id
user_id
entry_date
status
value_numeric
notes
sync_status
created_at
updated_at
```

## Status Values

```text
completed
partial
missed
not_applicable
```

## Constraints

- one entry per habit and date;
- entry ownership must match habit ownership;
- missed entries must not erase prior consistency;
- offline retries must be idempotent.

---

# 11.5 BodyMeasurement

Represents one body measurement snapshot.

## Suggested Fields

```text
id
client_generated_id
user_id
measurement_date
weight_kg
body_fat_percentage
chest_cm
waist_cm
hips_cm
left_arm_cm
right_arm_cm
left_thigh_cm
right_thigh_cm
notes
sync_status
created_at
updated_at
```

## Constraints

- one record per user and measurement_date in the MVP;
- at least one measurement value must exist;
- numeric values must be non-negative;
- updating the current day's record is allowed;
- historical changes must follow correction rules;
- future media support should use a separate private asset entity.

---

# 12. Gamification Domain

The exact formulas belong to GAMIFICATION-SPECIFICATION.md.

The database must support transparent and auditable progression.

# 12.1 ExperienceLedger

Represents one experience gain or adjustment.

## Suggested Fields

```text
id
user_id
event_type
source_entity_type
source_entity_id
experience_delta
reason
calculation_version
occurred_at
created_at
```

## Constraints

- each source event awards experience only once;
- experience adjustments use new ledger entries;
- ledger history is append-only;
- negative adjustments require an explicit reason;
- source references must support auditability.

---

# 12.2 UserProgression

Stores the current progression summary.

## Suggested Fields

```text
id
user_id
total_experience
current_level
performance_score
consistency_score
recovery_score
calculation_version
updated_at
```

## Constraints

- exactly one row per user;
- values must be reproducible from authoritative data or ledger entries;
- this table is a performance projection, not the historical source of truth.

---

# 12.3 Achievement

Represents a platform-defined achievement.

## Suggested Fields

```text
id
code
name
description
category
is_active
created_at
updated_at
```

## Constraints

- code must be unique;
- achievements must not encourage unsafe training behavior.

---

# 12.4 UserAchievement

Represents one achievement earned by one user.

## Suggested Fields

```text
id
user_id
achievement_id
source_entity_type
source_entity_id
earned_at
created_at
```

## Constraints

- one achievement may be earned once unless explicitly repeatable;
- the source event must be traceable.

---

# 13. Audit and Correction Domain

# 13.1 AuditEvent

Records meaningful security, administrative and lifecycle events.

## Suggested Fields

```text
id
actor_user_id
target_user_id
event_type
entity_type
entity_id
metadata
ip_address
user_agent
occurred_at
```

## Examples

- account disabled;
- session corrected;
- workout cancelled;
- plan activated;
- ownership-sensitive export;
- synchronization conflict resolved.

## Constraints

- audit metadata must not store secrets;
- audit events are append-only;
- access to audit data is restricted.

---

# 13.2 DataCorrection

Represents an explicit correction to historical data.

## Suggested Fields

```text
id
actor_user_id
target_user_id
entity_type
entity_id
field_name
old_value
new_value
reason
corrected_at
```

## Constraints

- reason is required;
- old and new values must be preserved;
- corrections must not delete the original audit trail;
- only authorized actors may perform corrections.

## MVP Policy

The user may correct their own historical execution values when permitted by the product.

Every correction must record:

- actor;
- timestamp;
- previous value;
- new value;
- reason.

---

# 14. Synchronization Domain

# 14.1 SyncOperation

Represents one client write or synchronization attempt.

## Suggested Fields

```text
id
client_operation_id
client_instance_id
user_id
entity_type
entity_client_id
operation_type
payload_hash
status
attempt_count
last_error_code
created_at
processed_at
```

## Status Values

```text
pending
processing
completed
conflict
failed
```

## Constraints

- client_operation_id must be unique per user;
- completed operations must return the previous result when retried;
- payload hashes may be used to detect inconsistent retries;
- sensitive payload content must not be stored unnecessarily.

## Operation Types

```text
create
update
complete
cancel
```

---

# 14.2 Offline Identifiers

Offline-created entities must use client-generated UUIDs.

The server must preserve or map these identifiers.

Every offline-capable entity should include:

```text
client_generated_id
sync_status
```

where appropriate.

---

# 14.3 Conflict Strategy

Conflicts must never cause silent data loss.

Conflict handling follows this order:

1. identify duplicate retries;
2. merge non-conflicting fields when safe;
3. prefer authoritative terminal states;
4. preserve both versions when automatic resolution is unsafe;
5. require user or administrative resolution;
6. record the final decision.

Completed and cancelled workout states are terminal.

A stale client cannot reactivate a terminal session.

---

# 15. Relationship Summary

```text
User
├── UserProfile
├── UserPreference
├── TrainingPlan
│   └── PlanWorkout
│       └── WorkoutExercise
│           └── Exercise
├── WorkoutSession
│   └── SessionExercise
│       └── CompletedSet
├── DailyRecovery
├── HabitDefinition
│   └── HabitEntry
├── BodyMeasurement
├── PersonalRecord
├── ExperienceLedger
├── UserProgression
├── UserAchievement
├── AuditEvent
├── DataCorrection
└── SyncOperation
```

---

# 16. Transaction Boundaries

The following operations must be transactional.

## TX-001 — Activate Training Plan

The operation must:

- archive or deactivate the previous active plan;
- activate the selected plan;
- preserve historical sessions;
- commit all changes together.

## TX-002 — Start Workout Session

The operation must:

- verify no active session exists;
- create the workout session;
- create session exercise snapshots;
- preserve original ordering and targets;
- commit all records together.

## TX-003 — Complete Workout Session

The operation must:

- validate the active session;
- persist pending set data;
- mark exercises appropriately;
- set the session to completed;
- create progression events;
- queue secondary calculations;
- commit authoritative completion together.

Secondary analytics may be processed after the transaction.

## TX-004 — Record Completed Set

The operation must:

- validate ownership;
- validate session state;
- enforce idempotency;
- create or return the completed set;
- update session progress safely.

## TX-005 — Correct Historical Data

The operation must:

- validate authorization;
- preserve the previous value;
- apply the correction;
- create DataCorrection;
- create AuditEvent;
- trigger dependent recalculation when necessary.

---

# 17. Deletion and Archival Rules

## Users

Account deletion must follow legal and product requirements.

Possible implementation:

- deactivate immediately;
- schedule data deletion;
- preserve required security or audit records;
- anonymize retained records where appropriate.

The final retention policy must be documented separately.

## Training Plans

Plans are archived, not physically deleted, when referenced by history.

## Exercises

Exercises are archived when referenced by plan or history.

## Workout Sessions

Completed and cancelled sessions are not physically deleted through normal user flows.

## Completed Sets

Completed sets are corrected through audit-aware operations.

They are not silently deleted after session completion.

## Measurements

Current-day records may be updated.

Historical removal, when allowed, must be auditable.

## Recovery and Habits

Historical records should not be deleted by plan or habit archival.

---

# 18. Indexing Requirements

Indexes should support real product queries rather than speculative optimization.

## Required Candidate Indexes

### Identity

```text
users(email)
```

### Training Plans

```text
training_plans(user_id, status)
plan_workouts(training_plan_id, sequence)
workout_exercises(plan_workout_id, sequence)
```

### Sessions

```text
workout_sessions(user_id, status)
workout_sessions(user_id, started_at desc)
workout_sessions(user_id, completed_at desc)
workout_sessions(user_id, client_generated_id)
session_exercises(workout_session_id, sequence)
completed_sets(session_exercise_id, set_number)
completed_sets(workout_session_id, completed_at)
```

### Recovery and Measurements

```text
daily_recovery(user_id, recovery_date)
habit_entries(user_id, entry_date)
body_measurements(user_id, measurement_date)
```

### Progress

```text
personal_records(user_id, exercise_id, record_type, is_current)
experience_ledger(user_id, occurred_at)
user_achievements(user_id, earned_at)
```

### Audit and Synchronization

```text
audit_events(target_user_id, occurred_at)
data_corrections(entity_type, entity_id)
sync_operations(user_id, client_operation_id)
sync_operations(status, created_at)
```

## Partial Unique Indexes

Recommended examples:

- one active plan per user;
- one active or paused workout session per user;
- one current personal record per user, exercise and record type.

---

# 19. Query Expectations

The schema must efficiently support:

- loading Today;
- finding the active workout session;
- loading the full active session with exercises and sets;
- listing recent completed sessions;
- loading exercise progress history;
- loading current personal records;
- loading daily recovery;
- loading measurement trends;
- calculating consistency;
- loading pending synchronization operations;
- verifying data ownership.

The active workout query is performance-critical.

It should avoid repeated queries for each exercise and set.

---

# 20. Data Validation

Validation exists at multiple layers.

## Database Constraints

Use for:

- uniqueness;
- non-negative values;
- required relationships;
- one-record-per-day rules;
- terminal lifecycle consistency where practical.

## Application Validation

Use for:

- metric-specific requirements;
- authorization;
- plan activation rules;
- session state transitions;
- business calculations;
- correction permissions.

## Client Validation

Use for usability only.

Client validation is never authoritative.

---

# 21. Security and Privacy

## Ownership Enforcement

Every query for personal data must include user ownership.

Object identifiers alone do not authorize access.

## Sensitive Fields

Authentication secrets must use framework security mechanisms.

Do not store:

- raw passwords;
- password reset tokens in plaintext;
- secret keys;
- unnecessary health details;
- private media in public storage.

## Audit Access

Audit and correction data must be restricted to authorized users.

## Export

Future data export must verify identity and include only the requesting user's data.

## Logging

Application logs must not contain:

- passwords;
- authentication tokens;
- full private notes;
- sensitive health values unless strictly necessary and protected.

---

# 22. Data Retention

The MVP retention policy must preserve:

- completed workout history;
- personal record sources;
- progression ledger;
- synchronization audit;
- correction history;
- security-relevant audit events.

Retention durations for deleted accounts, logs and backups must be defined before production launch.

---

# 23. Backup and Recovery

Production must support:

- automated database backups;
- restoration testing;
- documented recovery procedures;
- encrypted backup storage;
- restricted backup access.

A backup is not considered reliable until restoration has been tested.

---

# 24. Migration Rules

Database migrations must:

- be committed with the related code;
- avoid destructive operations without a migration plan;
- preserve historical data;
- include data migrations when semantics change;
- be tested against realistic data;
- support rollback or documented forward recovery when rollback is unsafe.

Large data changes should be separated from schema locks when necessary.

---

# 25. Testing Requirements

The data layer must include tests for:

- user ownership isolation;
- unique active plan;
- unique active session;
- session snapshot integrity;
- completed set validation;
- idempotent synchronization;
- duplicate retry prevention;
- workout completion transactions;
- cancelled workout behavior;
- historical correction audit;
- daily recovery uniqueness;
- measurement uniqueness;
- personal record source traceability;
- experience ledger uniqueness;
- deletion and archival behavior.

PostgreSQL-specific constraints must be tested using PostgreSQL.

---

# 26. MVP Data Decisions

The following decisions are accepted for the MVP.

## MDD-001 — Plan Assignment

Training plans are imported from a spreadsheet or assigned by an administrator.

Users do not create plans in the MVP.

## MDD-002 — Workout Rescheduling

Users may move a scheduled workout to another date without modifying the plan definition.

The rescheduling record must preserve the original schedule when auditability is required.

## MDD-003 — Exercise Replacement

Exercise replacement is not supported in the MVP.

## MDD-004 — Cancelled Sessions

Cancelled sessions remain stored.

Completed sets inside the cancelled session remain traceable.

Cancelled sessions do not count as completed workouts.

## MDD-005 — Historical Corrections

Users may correct permitted values in their own completed sessions.

Corrections require an audit record.

## MDD-006 — Same-Day Measurements

One body measurement record exists per user per calendar day.

The current day's record may be updated.

## MDD-007 — Offline Workout Boundary

The MVP supports offline:

- opening a previously cached workout;
- starting that workout;
- recording sets;
- using the rest timer;
- pausing;
- resuming;
- completing;
- synchronizing later.

## MDD-008 — MVP Notifications

The MVP supports notifications for:

- rest timer completion;
- persistent synchronization failure.

Workout reminders are deferred.

---

# 27. Open Database Decisions

## ODD-001 — Workout Scheduling Entity

Determine whether rescheduling belongs directly on WorkoutSession or requires a dedicated schedule entity.

## ODD-002 — Spreadsheet Import Audit

Define how imported rows, source files and validation errors are persisted.

## ODD-003 — Private Media

Define storage and metadata for future progress photos.

## ODD-004 — Account Deletion Retention

Define legal and product retention periods before production.

## ODD-005 — Calculation Processing

Determine which progression calculations are synchronous and which use background jobs.

---

# 28. Definition of Done

The database specification is implemented successfully when:

- ownership is enforced;
- historical sessions use snapshots;
- plan edits cannot rewrite history;
- only one active session exists per user;
- completed sets are idempotent;
- offline retries do not create duplicates;
- cancelled sessions remain traceable;
- historical corrections are audited;
- daily recovery and measurement uniqueness are enforced;
- progression events are traceable;
- critical queries are indexed;
- deletion behavior preserves integrity;
- migrations and PostgreSQL constraints are tested.

---

# 29. Specification Completion

This document defines the official database behavior for Forge version 1.

Django models and migrations may use implementation-specific names, but they must preserve:

- entity meaning;
- ownership;
- relationships;
- constraints;
- lifecycle;
- historical integrity;
- synchronization safety;
- auditability.

Meaningful changes to these decisions must update this document and, when architectural, be recorded through an ADR.

---

# End of Database Specification
