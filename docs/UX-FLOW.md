# UX FLOW

Status: Approved

Version: 1.0.0

Owner: João Victor

Last Updated: 2026-08-09

Related Documents:

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- GAMIFICATION-SPECIFICATION.md
- DESIGN-DIRECTION.md

---

# 1. Purpose

This document defines the official user experience flows for Forge.

It describes how users move through the product, which decisions they make, which system states exist, which information is required at each step and how the application responds to expected and unexpected situations.

This document is intentionally independent from visual design.

It does not define:

- colors;
- typography;
- component styles;
- spacing;
- animations;
- final page layouts;
- database implementation;
- framework-specific behavior.

The objective is to ensure that product behavior remains coherent before visual prototyping and implementation begin.

---

# 2. UX Principles

## UX-001 — One Primary Action

Every screen or state must have one clearly identifiable primary action.

Secondary actions must not compete with the main task.

## UX-002 — Immediate Context

The user should always understand:

- where they are;
- what they are doing;
- what happens next;
- whether their action was saved.

## UX-003 — Minimal Interaction During Training

Workout execution must require the minimum possible number of interactions.

The product must avoid unnecessary navigation, repeated confirmations and excessive form fields.

## UX-004 — Mobile First

All critical flows must work comfortably on a mobile device using one hand.

## UX-005 — Offline Continuity

Temporary connectivity loss must not interrupt an active workout.

## UX-006 — Progressive Disclosure

Secondary information must remain available without overwhelming the primary task.

## UX-007 — Clear System Feedback

Every meaningful action must produce visible feedback.

## UX-008 — Recovery Without Punishment

Users must be able to recover from mistakes without losing meaningful data.

## UX-009 — Historical Trust

Completed workout data must be presented as historical fact.

## UX-010 — Action Before Analytics

The dashboard prioritizes what the user should do now.

---

# 3. Experience Model

Forge is organized around user journeys rather than isolated pages.

The primary journeys are:

1. First-Time User
2. Returning User
3. Daily Overview
4. Workout Preparation
5. Workout Execution
6. Rest Interval
7. Workout Interruption and Recovery
8. Workout Completion
9. Training History
10. Exercise Progress
11. Recovery and Habits
12. Body Measurements
13. Profile and Settings
14. Authentication Recovery
15. Offline Synchronization

Each journey is described through:

- objective;
- entry conditions;
- expected outcome;
- required information;
- happy path;
- alternative flows;
- error states;
- exit states.

---

# 4. Global Navigation Model

## Application Launch

When the client starts, Forge presents a branded launch surface while local state,
authentication and remote training context are hydrated.

The launch surface:

- disappears as soon as hydration is complete;
- never displays fake progress;
- does not interrupt route resolution;
- respects reduced-motion preferences;
- keeps the underlying interface unavailable until it is ready.

## Primary Destinations

### Today

Purpose:

- present the current workout;
- present relevant daily actions;
- show immediate progress context;
- resume an active session.

### Plan

Purpose:

- display the active training plan;
- show scheduled workouts;
- show exercise structure;
- provide plan-level context.

### Progress

Purpose:

- show training history;
- show personal records;
- show measurements;
- show consistency;
- show recovery trends;
- show gamification progress.

### Account

Purpose:

- manage user profile;
- manage preferences;
- manage authentication;
- access legal and support information.

## Active Workout Navigation Rule

While a workout is active:

- persistent navigation is hidden or minimized;
- the workout becomes the dominant context;
- leaving the session requires an explicit action;
- accidental navigation must not discard progress.

---

# 5. Global Experience States

## GS-001 — Loading

Used when data is being retrieved.

Rules:

- preserve layout stability;
- avoid full-screen blocking when unnecessary;
- show what is loading;
- never present stale controls as actionable.

## GS-002 — Empty

An empty state must explain:

- what is missing;
- why it matters;
- which action is available.

## GS-003 — Error

An error state must explain:

- what failed;
- whether data was preserved;
- what the user can do next.

## GS-004 — Offline

The interface must distinguish between:

- action stored locally;
- action waiting for synchronization;
- action that cannot be performed offline.

## GS-005 — Syncing

Pending actions are being sent to the server.

The user must not be forced to wait unless the next action depends on successful synchronization.

## GS-006 — Success

Success feedback must be proportional to the action.

## GS-007 — Permission Denied

The application must explain that access is unavailable without exposing sensitive details.

---

# 6. Journey 01 — First-Time User

## Objective

Allow a new user to create an account, provide essential information and reach Today with a usable training plan or a clear plan setup state.

## Entry Conditions

- user is not authenticated;
- user does not have an existing account.

## Expected Outcome

The user reaches Today with:

- an authenticated account;
- a completed minimum profile;
- a defined training goal;
- an active training plan or a clear setup status.

## Happy Path

```text
Application Entry
↓
Create Account
↓
Enter Email and Password
↓
Accept Required Terms
↓
Submit Registration
↓
Account Created
↓
Profile Setup
↓
Define Training Goal
↓
Provide Essential Physical Information
↓
Training Plan Setup
↓
Today
```

## Alternative Flows

### AF-FTU-001 — Email Already Registered

Available actions:

- Sign In
- Recover Password
- Use Another Email

### AF-FTU-002 — User Leaves Onboarding

Completed information is preserved when safe.

The user resumes from the first incomplete required step.

### AF-FTU-003 — No Training Plan Available

The user enters a clear waiting or setup state.

### AF-FTU-004 — Offline During Registration

Account creation cannot be completed offline.

The system preserves safe form values and asks the user to reconnect.

---

# 7. Journey 02 — Returning User

## Objective

Allow an existing user to enter the product quickly and continue the most relevant activity.

## Happy Path

```text
Application Entry
↓
Valid Session?
├── Yes → Today
└── No → Sign In
             ↓
         Credentials Valid
             ↓
           Today
```

## Alternative Flows

### AF-RU-001 — Active Workout Exists

```text
Application Entry
↓
Active Workout Detected
↓
Resume Workout
```

### AF-RU-002 — Authentication Expired During Active Workout

The user may continue locally when possible.

Synchronization requires authentication renewal.

### AF-RU-003 — Account Disabled

Access is blocked with a clear explanation and support path.

---

# 8. Journey 03 — Daily Overview

## Objective

Help the user understand what matters today and begin the next relevant action.

## Information Priority

1. active workout;
2. scheduled workout;
3. required daily action;
4. recent meaningful progress;
5. secondary historical context.

## Today States

### TD-001 — Active Workout

Primary action:

Resume Workout.

### TD-002 — Workout Scheduled

Primary action:

Start Workout.

### TD-003 — Rest Day

The interface must not imply failure.

### TD-004 — No Active Plan

The system explains the setup or assignment status.

### TD-005 — Workout Already Completed

The system presents completion, earned progress and the next scheduled workout.

---

# 9. Journey 04 — Workout Preparation

## Objective

Allow the user to understand the workout and begin without unnecessary friction.

## Happy Path

```text
Workout Preview
↓
Review Structure
↓
Start Workout
↓
Workout Session Created
↓
First Exercise
```

## Rules

- starting a workout creates one active session;
- duplicate active sessions are blocked;
- the first exercise must be immediately accessible;
- optional details must not delay starting.

## Alternative Flows

### AF-WP-001 — Another Session Is Active

The user must resume the existing session.

### AF-WP-002 — Workout Data Not Available Offline

The user receives a clear warning before starting.

### AF-WP-003 — User Cancels Before Starting

No workout session is created.

---

# 10. Journey 05 — Workout Execution

## Objective

Allow the user to complete a workout with minimal cognitive and interaction cost.

## Primary Information

The active exercise experience should prioritize:

1. exercise name;
2. current set;
3. target;
4. last relevant performance;
5. performance input;
6. primary completion action;
7. rest interval;
8. technique details on demand.

## Happy Path

```text
Active Exercise
↓
Enter or Confirm Performance
↓
Complete Set
↓
Set Saved
↓
Rest Interval
↓
Next Set or Exercise
↓
Repeat
↓
Finish Workout
```

## Alternative Flows

### AF-WE-001 — Skip Set

Skipping requires a clear action.

### AF-WE-002 — Skip Exercise

Skipped exercises remain visible in the session summary.

### AF-WE-003 — Replace Exercise

This flow must not be invented unless approved by product rules.

### AF-WE-004 — Edit Current Set

The user may correct a set before workout completion.

### AF-WE-005 — Invalid Input

The system explains which value is invalid without clearing valid values.

### AF-WE-006 — Duplicate Submission

Repeated taps must not create duplicate sets.

### AF-WE-007 — App Closed

The active session state is restored on return.

### AF-WE-008 — Connection Lost

The set is stored locally and marked as pending synchronization.

---

# 11. Journey 06 — Rest Interval

## Objective

Help the user recover between sets without interrupting focus.

## Happy Path

```text
Set Completed
↓
Rest Timer Starts
↓
Timer Reaches Zero
↓
User Receives Feedback
↓
Next Set
```

## Rules

- the timer continues across workout screens;
- the timer is based on elapsed time;
- the user may continue early;
- audio and vibration respect user settings.

---

# 12. Journey 07 — Workout Interruption and Recovery

## Objective

Preserve progress when the workout is paused, interrupted or abandoned.

## Pause Flow

```text
Active Workout
↓
Pause Workout
↓
Session State Preserved
↓
Resume Later
```

## Leave Protection

When leaving an active workout, provide:

- Resume Later
- Cancel Workout
- Stay in Workout

## Cancel Flow

```text
Active Workout
↓
Cancel Workout
↓
Explain Consequences
↓
Confirm Cancellation
↓
Session Marked Cancelled
↓
Today
```

## Recovery Flow

```text
Application Reopened
↓
Active Session Found
↓
Restore Local and Server State
↓
Resolve Conflict if Necessary
↓
Resume Exact Workout Position
```

## Conflict Rules

- preserve both versions;
- avoid silent data loss;
- prefer the latest valid action;
- request user input only when necessary;
- record the resolution.

---

# 13. Journey 08 — Workout Completion

## Objective

Close the active session, confirm saved data and show a meaningful summary.

## Happy Path

```text
Final Exercise Completed
↓
Finish Workout
↓
Validate Session
↓
Persist Final State
↓
Calculate Progress
↓
Workout Summary
↓
Today
```

## Summary Priority

1. completion confirmation;
2. duration;
3. exercises and sets completed;
4. meaningful progress;
5. personal records;
6. experience or level progress;
7. skipped work;
8. optional notes.

## Alternative Flows

### AF-WC-001 — Incomplete Workout

Available actions:

- return to workout;
- finish anyway, when allowed;
- cancel.

### AF-WC-002 — Offline Completion

The workout is completed locally and marked as pending synchronization.

### AF-WC-003 — Calculation Failure

The workout remains completed even if secondary calculations fail.

### AF-WC-004 — New Personal Record

Display a restrained but meaningful celebration.

---

# 14. Journey 09 — Training History

## Objective

Allow users to review completed and cancelled workout sessions.

## Happy Path

```text
Progress
↓
Training History
↓
Select Period or Session
↓
Review Workout Summary
↓
Review Exercise Details
```

## Rules

- historical sessions must not behave like active sessions;
- editing is not a default action;
- plan changes must not modify historical display;
- corrections must be explicit and auditable.

---

# 15. Journey 10 — Exercise Progress

## Objective

Help the user understand performance evolution for one exercise.

## Happy Path

```text
Progress
↓
Exercise Progress
↓
Select Exercise
↓
Review Current Performance
↓
Review Historical Trend
↓
Review Personal Records
```

## Rules

- charts must have textual equivalents;
- calculated values must explain their origin;
- exercise metrics require compatible visualizations;
- incompatible exercises must not be compared as equals.

---

# 16. Journey 11 — Recovery and Habits

## Objective

Allow users to record daily recovery information with low effort.

## Happy Path

```text
Today or Progress
↓
Daily Recovery
↓
Enter Available Information
↓
Save
↓
Daily State Updated
```

## Rules

- only one recovery record exists per calendar day;
- users may update today's record;
- missing information is not failure;
- recovery registration must not block training;
- offline data is synchronized later.

---

# 17. Journey 12 — Body Measurements

## Objective

Allow users to register and review physical measurements as historical snapshots.

## Happy Path

```text
Progress
↓
Measurements
↓
Add Measurement
↓
Enter Date and Values
↓
Validate
↓
Save Snapshot
↓
Measurement History
```

## Rules

- measurements are historical snapshots;
- new snapshots are preferred over rewriting history;
- units must be explicit;
- optional fields must be clear;
- photos require privacy-aware handling.

---

# 18. Journey 13 — Profile and Settings

## Objective

Allow users to manage identity, preferences and product behavior.

## Sections

- personal profile;
- physical information;
- training goal;
- units;
- time zone;
- notification preferences;
- appearance;
- privacy;
- account security;
- sign out;
- account deletion, when supported.

## Rules

- sensitive changes may require reauthentication;
- destructive actions require explicit confirmation;
- profile changes must not rewrite historical facts.

---

# 19. Journey 14 — Authentication Recovery

## Objective

Allow users to regain secure access to their account.

## Happy Path

```text
Sign In
↓
Forgot Password
↓
Enter Email
↓
Generic Confirmation
↓
Open Secure Recovery Link
↓
Create New Password
↓
Password Updated
↓
Sign In
```

## Security Rules

- do not reveal whether an email exists;
- recovery links expire;
- recovery links are single-use when possible;
- successful reset may invalidate existing sessions.

---

# 20. Journey 15 — Offline Synchronization

## Objective

Preserve user work across connectivity interruptions and synchronize safely later.

## Synchronization States

- Synced
- Pending
- Syncing
- Conflict
- Failed

## Happy Path

```text
Action Performed Offline
↓
Saved Locally
↓
Pending Indicator
↓
Connection Restored
↓
Automatic Synchronization
↓
Server Confirmation
↓
Synced Indicator
```

## Rules

- local data is kept until server confirmation;
- synchronization must be idempotent;
- duplicate records must be prevented;
- failures retry safely;
- manual action is requested only when necessary.

---

# 21. Notifications and Feedback

Notifications may be used for:

- rest timer completion;
- optional workout reminders;
- important synchronization failure.

They must:

- respect preferences;
- avoid guilt-based language;
- avoid excessive frequency;
- provide direct value.

---

# 22. Confirmation Strategy

Confirmations are required only when an action is:

- destructive;
- difficult to reverse;
- privacy-sensitive;
- likely to cause meaningful data loss.

Routine actions must not require confirmation.

---

# 23. Error Recovery Strategy

Every recoverable error must provide a next action.

Examples:

| Situation | Required Recovery |
|---|---|
| Set failed to sync | Keep locally and retry |
| Session conflict | Preserve both states and resolve safely |
| Invalid measurement | Highlight the invalid field |
| Expired authentication | Reauthenticate without discarding local work |
| Failed photo upload | Preserve other measurement data |
| Missing plan | Explain setup or assignment path |

---

# 24. Accessibility Requirements

Every critical journey must support:

- keyboard navigation;
- visible focus;
- screen-reader labels;
- semantic headings;
- sufficient contrast;
- non-color status indicators;
- touch-friendly controls;
- reduced-motion preferences;
- readable numeric inputs;
- associated error messages.

Workout execution must not depend exclusively on color, sound, vibration or animation.

---

# 25. UX Acceptance Criteria

The UX Flow is successfully implemented when:

- a new user reaches Today without confusion;
- a returning user resumes an active workout;
- a set can be recorded with minimal interaction;
- workout execution survives temporary connection loss;
- completion produces a reliable summary;
- historical sessions remain distinct from active sessions;
- recovery and measurements can be recorded;
- destructive actions are protected;
- every error provides a recovery path;
- primary journeys are usable on mobile;
- accessibility requirements are met.

---

# 26. Open Product Decisions

## OPD-001 — Training Plan Assignment

Who creates or assigns the initial plan?

## OPD-002 — Workout Rescheduling

Can users move a scheduled workout to another day?

## OPD-003 — Exercise Replacement

Can users replace exercises during a workout?

## OPD-004 — Partial Workout History

How are cancelled workouts and completed sets represented historically?

## OPD-005 — Historical Corrections

Which historical data may be corrected, by whom and with which audit information?

## OPD-006 — Same-Day Measurements

Can users create multiple measurement snapshots on the same day?

## OPD-007 — Offline MVP Boundary

Which actions are guaranteed offline in the first version?

## OPD-008 — Notification Scope

Which reminders are included in the MVP?

---

# 27. Journey Dependency Map

```text
First-Time User
└── Authentication
    └── Profile Setup
        └── Training Plan Setup
            └── Today

Returning User
└── Authentication State
    ├── Today
    └── Resume Active Workout

Today
├── Workout Preparation
│   └── Workout Execution
│       ├── Rest Interval
│       ├── Interruption and Recovery
│       └── Workout Completion
│           ├── Workout Summary
│           ├── Training History
│           └── Exercise Progress
├── Recovery and Habits
├── Measurements
└── Progress

Account
├── Profile and Settings
├── Authentication Security
└── Sign Out
```

---

# 28. Specification Completion

This document defines the official user experience journeys for Forge version 1.

Visual design must derive from these journeys.

Implementation must preserve:

- journey outcomes;
- state transitions;
- recovery behavior;
- offline continuity;
- historical integrity;
- product principles.

Any meaningful change to a journey must update this document.

---

# End of UX Flow
