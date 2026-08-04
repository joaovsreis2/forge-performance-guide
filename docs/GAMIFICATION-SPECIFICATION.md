# GAMIFICATION SPECIFICATION

Status: Draft

Version: 1.0.0

Owner: João Victor

Last Updated: 2026-08-03

Related Documents:

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
- DATABASE-SPECIFICATION.md
- DESIGN-DIRECTION.md

---

# 1. Purpose

This document defines the official gamification model for Forge.

It describes:

- experience generation;
- level progression;
- user attributes;
- achievements;
- personal-record recognition;
- consistency reinforcement;
- recovery reinforcement;
- anti-abuse rules;
- auditability;
- safety constraints;
- presentation rules.

Gamification exists to reinforce healthy training behavior and visible progress.

It must never:

- replace the purpose of training;
- encourage unsafe behavior;
- punish users for missing a workout;
- pressure users into excessive frequency;
- hide how values are calculated;
- reward data manipulation.

---

# 2. Gamification Principles

## GP-001 — Progress Before Points

Real training progress is more important than artificial rewards.

Experience, levels and achievements must reflect meaningful behavior rather than arbitrary interaction.

---

## GP-002 — Consistency Over Intensity

Forge rewards sustainable consistency more than isolated extreme performance.

---

## GP-003 — No Punitive Loss

Users do not lose experience, levels or achievements because they missed a workout, became inactive or returned after a break.

---

## GP-004 — Safety Over Engagement

No reward may encourage:

- excessive training frequency;
- unsafe load increases;
- ignoring recovery;
- training through pain;
- manipulating body measurements;
- completing meaningless sets.

---

## GP-005 — Explainable Progression

Every experience award and score change must be explainable.

The user should be able to understand:

- what generated the reward;
- how much was awarded;
- why it counted;
- which source event produced it.

---

## GP-006 — Auditable Events

Experience and achievements must be tied to traceable source events.

---

## GP-007 — Diminishing Engagement Pressure

Forge must avoid engagement loops based on fear, urgency or loss aversion.

Examples to avoid:

- expiring streaks;
- countdown pressure;
- public rankings;
- shame-based reminders;
- daily penalties.

---

## GP-008 — Meaningful Celebration

Celebrations are reserved for meaningful milestones.

Routine actions receive subtle confirmation.

---

## GP-009 — Versioned Calculations

Every derived progression value must be tied to a calculation version.

---

## GP-010 — Historical Stability

Corrections may recalculate derived values, but they must not silently erase the historical reason why a reward was previously granted.

---

# 3. Gamification Model

Forge uses four connected progression systems.

## 3.1 Experience

Experience represents total accumulated participation and progress.

Experience is permanent except for explicit audited corrections.

---

## 3.2 Level

Level is a readable summary of total experience.

Level does not represent medical, athletic or competitive classification.

---

## 3.3 Attributes

Forge tracks three high-level attributes:

- Performance
- Consistency
- Recovery

Attributes explain different dimensions of progress.

---

## 3.4 Achievements

Achievements recognize meaningful milestones.

They do not grant competitive advantage.

---

# 4. Experience Ledger

The ExperienceLedger is the authoritative history of experience changes.

Each entry must contain:

```text
user
event type
source entity
experience delta
reason
calculation version
timestamp
```

## Rules

- every source event may award experience only once;
- retries must return the original result;
- corrections create new ledger entries;
- previous ledger entries are never silently edited;
- negative adjustments require an explicit reason;
- experience must remain traceable to authoritative product data.

---

# 5. Experience Event Types

The MVP supports the following event categories.

## XP-001 — Workout Completion

Awarded when a workout session becomes completed.

Eligibility:

- the session contains meaningful execution data;
- the session was not previously rewarded;
- the session is not cancelled;
- duplicate synchronization did not create duplicate completion.

Recommended base value:

```text
100 XP
```

---

## XP-002 — Exercise Completion

Awarded for completing prescribed exercises inside a completed workout.

Recommended value:

```text
5 XP per completed exercise
```

Limits:

- only exercises belonging to a completed session count;
- skipped exercises do not count;
- the award is capped by the prescribed session structure.

---

## XP-003 — Completed Set

Awarded for meaningful completed sets.

Recommended value:

```text
2 XP per valid completed set
```

Limits:

- the set must contain meaningful execution data;
- duplicate sets do not count;
- extra sets beyond a reasonable session cap do not generate unlimited experience.

Recommended cap:

```text
20 rewarded sets per workout
```

---

## XP-004 — Personal Record

Awarded for a validated personal record.

Recommended values:

```text
25 XP for a standard personal record
50 XP for a major personal record
```

A major record must be defined by deterministic rules.

Examples:

- meaningful load increase;
- meaningful repetition increase;
- new distance milestone;
- new duration milestone.

Safety rule:

Small arbitrary increases must not be encouraged solely to obtain rewards.

---

## XP-005 — Weekly Consistency

Awarded after completing the planned minimum for a calendar week.

Recommended values:

```text
50 XP for meeting the weekly target
25 XP for meaningful partial consistency
```

Rules:

- no penalty for missing the target;
- rest weeks and plan changes must be handled fairly;
- weeks with no scheduled workouts must not be considered failures.

---

## XP-006 — Recovery Registration

Awarded for recording meaningful daily recovery information.

Recommended value:

```text
5 XP per valid day
```

Limits:

- one award per calendar day;
- empty records do not count;
- editing the same record does not award again.

---

## XP-007 — Habit Completion

Awarded for completing approved habits.

Recommended value:

```text
3 XP per completed habit
```

Limits:

- only active habits count;
- one award per habit per day;
- habit XP must have a daily cap.

Recommended daily cap:

```text
15 XP
```

---

## XP-008 — Measurement Snapshot

Awarded for creating a valid body measurement snapshot.

Recommended value:

```text
10 XP
```

Limits:

- one reward per calendar day;
- edits do not award additional experience;
- no reward is based on the measurement value itself.

Forge rewards recording, not weight loss or body-size change.

---

## XP-009 — Achievement Earned

Achievements do not grant additional experience by default.

This avoids reward duplication.

A future version may define explicit achievement rewards.

---

## XP-010 — Administrative Adjustment

Used only for:

- correcting duplicated rewards;
- restoring missing rewards;
- resolving calculation defects.

Every adjustment requires:

- actor;
- reason;
- source;
- audit event.

---

# 6. Experience Caps

Caps prevent unhealthy or manipulative behavior.

## Daily Cap

Recommended initial value:

```text
500 XP per calendar day
```

Workout completion remains valid even if the cap is reached.

Excess eligible experience may be recorded as zero-award ledger entries for transparency.

## Workout Set Cap

Only the first valid rewarded sets within the defined cap generate set XP.

Recommended:

```text
20 sets per completed workout
```

## Habit Cap

Recommended:

```text
15 XP per day
```

## Recovery Cap

Recommended:

```text
5 XP per day
```

## Measurement Cap

Recommended:

```text
10 XP per day
```

## Cap Principle

Caps limit gamification rewards, not legitimate user data.

Users may record valid training beyond a reward cap.

---

# 7. Level Progression

## 7.1 Level Formula

The MVP uses a deterministic increasing-cost progression curve.

Recommended formula:

```text
XP required to reach level N = 100 × N × (N - 1)
```

Examples:

| Level | Total XP Required |
|---:|---:|
| 1 | 0 |
| 2 | 200 |
| 3 | 600 |
| 4 | 1,200 |
| 5 | 2,000 |
| 10 | 9,000 |
| 20 | 38,000 |

## 7.2 Level Rules

- level never decreases because of inactivity;
- level changes only through ledger totals;
- level has no effect on access to essential product features;
- level does not imply athletic expertise;
- level-up events are auditable;
- the level calculation version must be stored.

## 7.3 Presentation

The user may see:

- current level;
- total experience;
- progress toward the next level;
- recent experience sources.

The user should not see fake precision when the underlying calculation is simple.

---

# 8. Attribute Model

Attributes use a normalized score from 0 to 100.

They are explanatory indicators, not permanent identity labels.

## 8.1 Performance

Performance reflects measurable training progress.

Possible inputs:

- validated personal records;
- progression in exercise performance;
- completed training volume;
- plan adherence;
- recent trend.

Performance must not be based only on absolute weight.

Users with different body sizes, experience levels and exercises must not be compared directly.

### Initial Calculation Direction

Recommended weighting:

```text
40% exercise progression
25% validated personal records
20% completed planned work
15% recent performance trend
```

The final formula must be tested before production.

---

## 8.2 Consistency

Consistency reflects sustainable training participation.

Possible inputs:

- completed scheduled workouts;
- meaningful partial completion;
- weekly adherence;
- return after inactivity;
- habit completion.

Consistency must not use an expiring all-or-nothing streak.

### Initial Calculation Direction

Recommended rolling period:

```text
28 days
```

Recommended weighting:

```text
60% planned workout adherence
25% weekly participation
15% approved habit consistency
```

Rules:

- unscheduled rest days do not reduce the score;
- plan changes must update the expected denominator;
- illness, travel and breaks may be represented in future versions.

---

## 8.3 Recovery

Recovery reflects recovery-related behavior and available self-reported data.

Possible inputs:

- sleep duration;
- hydration registration;
- recovery habits;
- cardio or mobility behavior;
- recent completeness of recovery data.

Recovery is not a medical score.

### Initial Calculation Direction

Recommended rolling period:

```text
14 days
```

Recommended weighting:

```text
45% sleep behavior
25% hydration behavior
20% recovery habit completion
10% data consistency
```

Rules:

- missing data reduces confidence, not necessarily the score;
- Forge must distinguish low score from low-confidence score;
- the interface must avoid medical conclusions.

---

# 9. Attribute Confidence

Every attribute may include a confidence indicator.

Recommended values:

```text
low
medium
high
```

Confidence depends on:

- data volume;
- recency;
- completeness;
- source reliability.

The interface must not present a high-confidence interpretation from insufficient data.

---

# 10. Personal Records

A Personal Record must be derived from authoritative completed-set data.

## Supported MVP Record Types

```text
maximum_weight
maximum_repetitions
longest_duration
maximum_distance
highest_volume
estimated_one_rep_max
```

## Record Validation

A record is valid when:

- the source set belongs to a completed workout;
- the exercise metric supports the record type;
- the value is greater than the previous valid record;
- the source data is not duplicated;
- the result passes deterministic validation.

## Estimated One-Rep Max

If supported, the formula must be versioned.

Recommended initial formula:

```text
Epley:
estimated 1RM = weight × (1 + repetitions / 30)
```

Restrictions:

- use only within a defined repetition range;
- display as an estimate;
- do not treat as an actual tested maximum;
- do not use it to encourage unsafe attempts.

## Record Correction

If source data is corrected:

- recalculate affected records;
- preserve correction history;
- create adjustment ledger entries when necessary;
- avoid silent disappearance without explanation.

---

# 11. Consistency Model

Forge does not use punitive streaks.

## Weekly Target

The weekly target is based on scheduled workouts.

Example:

```text
3 scheduled workouts
```

Possible states:

```text
not_started
in_progress
met
partially_met
```

There is no failed state shown as punishment.

## Return Recognition

Users returning after inactivity may receive a positive return message.

No experience bonus is required by default.

The product should emphasize continuation, not shame.

## Partial Completion

A partially completed workout may contribute to consistency only when product rules define meaningful completion.

Cancelled workouts do not count as completed workouts.

---

# 12. Recovery Gamification

Forge rewards recovery-related behavior, not idealized recovery values.

Examples of rewardable actions:

- recording sleep;
- recording hydration;
- completing an approved recovery habit;
- maintaining recovery data over time.

Forge must not award more experience because:

- the user slept an extreme number of hours;
- the user consumed excessive water;
- the user reported a lower body weight;
- the user trained while poorly recovered.

---

# 13. Achievement System

Achievements recognize meaningful milestones.

## Achievement Categories

```text
training
consistency
progress
recovery
history
return
```

## MVP Achievement Examples

### Training

- First Workout
- Five Workouts Completed
- Twenty-Five Workouts Completed
- One Hundred Workouts Completed

### Consistency

- First Complete Week
- Four Consistent Weeks
- Twelve Consistent Weeks

### Progress

- First Personal Record
- Five Personal Records
- Progress in Three Exercises

### Recovery

- First Recovery Entry
- Seven Recovery Entries
- Fourteen Days of Recovery Awareness

### History

- First Measurement Snapshot
- Ten Measurement Snapshots
- Six Months of Recorded Training

### Return

- Returned After a Break

This achievement must use respectful language.

## Achievement Rules

- achievements are deterministic;
- achievements are awarded once unless explicitly repeatable;
- historical achievements are not removed because of inactivity;
- unsafe behavior cannot unlock achievements;
- achievement sources must be traceable;
- hidden achievements should be rare and never manipulate the user.

---

# 14. Celebration Levels

Forge uses three celebration levels.

## Level 1 — Subtle Confirmation

Used for:

- set completed;
- recovery entry saved;
- habit completed;
- measurement recorded.

Examples:

- checkmark;
- concise message;
- small progress update.

## Level 2 — Meaningful Milestone

Used for:

- workout completion;
- weekly target met;
- new personal record;
- achievement earned.

Examples:

- dedicated summary section;
- restrained animation;
- clear explanation.

## Level 3 — Major Milestone

Used for:

- level milestone;
- major long-term consistency achievement;
- major training history milestone.

Rules:

- rare;
- skippable;
- reduced-motion compatible;
- no blocking interaction after dismissal.

---

# 15. Anti-Abuse Rules

## AR-001 — Duplicate Events

Duplicate synchronization events must not award duplicate experience.

## AR-002 — Repeated Editing

Editing a record does not award experience again.

## AR-003 — Excessive Set Creation

Sets beyond the configured reward cap do not generate additional set XP.

## AR-004 — Deleted or Cancelled Sources

Cancelled sessions do not award workout completion XP.

Rewards tied to invalidated data require audited adjustment.

## AR-005 — Impossible Values

Clearly impossible values must be rejected or flagged.

Examples:

- negative repetitions;
- negative duration;
- invalid distance;
- unsupported record metric.

## AR-006 — Time Manipulation

Calendar-based rewards must use server-authoritative time and user time zone rules.

## AR-007 — Multiple Devices

Client-generated IDs and idempotency keys prevent duplicate rewards across devices.

## AR-008 — Manual Administration

Administrative grants require explicit reason and audit.

---

# 16. Safety Rules

## SRG-001 — No Reward for Extreme Load

Forge must not award additional experience based solely on absolute load.

## SRG-002 — No Reward for Excess Frequency

Multiple workouts in a short period must not generate unlimited gamification benefit.

## SRG-003 — No Penalty for Rest

Rest days and recovery periods do not reduce permanent progression.

## SRG-004 — No Body-Value Rewards

Experience is not awarded for:

- weight loss;
- weight gain;
- body-fat reduction;
- circumference changes.

Only the act of recording a valid snapshot may be rewarded.

## SRG-005 — Pain and Injury

Forge must not reward training through pain or injury.

Future pain-reporting features must prioritize safety over gamification.

## SRG-006 — Recovery Awareness

Low recovery indicators must not be framed as moral failure.

## SRG-007 — No Public Competition

The MVP has no public leaderboard.

---

# 17. Correction and Recalculation Rules

Historical corrections may affect:

- experience;
- personal records;
- attributes;
- achievements;
- summaries.

## Correction Process

1. validate correction authorization;
2. preserve old value;
3. apply new value;
4. recalculate affected derived data;
5. create ledger adjustment when required;
6. create audit event;
7. preserve user-facing explanation.

## Level Changes After Correction

A legitimate correction may reduce total experience.

If this causes a lower calculated level:

- the correction must be explained;
- the previous ledger history remains visible;
- the adjustment must be audited.

This is a correction, not an inactivity penalty.

---

# 18. Calculation Versioning

Each calculation family must have a version.

Examples:

```text
xp_v1
level_v1
performance_v1
consistency_v1
recovery_v1
record_e1rm_v1
```

## Versioning Rules

- version names are immutable;
- changing a formula creates a new version;
- recalculation policy must be explicit;
- historical source events remain preserved;
- the active version is documented;
- migrations must not silently reinterpret old values.

---

# 19. Presentation Rules

The interface must show progression with context.

## Experience History

Users should be able to review recent experience sources.

Example:

```text
Workout completed            +100 XP
8 valid sets                  +16 XP
New repetition record         +25 XP
Daily recovery recorded        +5 XP
```

## Attribute Explanation

Every attribute view should explain:

- what the score represents;
- which period is considered;
- which data contributes;
- confidence level;
- how to improve safely.

## Language

Avoid language such as:

- failure;
- lazy;
- weak;
- lost your streak;
- falling behind;
- no excuses.

Prefer:

- continue;
- return;
- build consistency;
- recovery matters;
- progress over time;
- next useful action.

---

# 20. Notifications

Gamification notifications are limited.

The MVP may notify for:

- meaningful personal record;
- achievement earned;
- major level milestone.

Notifications must not be used for:

- daily guilt;
- streak expiration;
- comparative pressure;
- repeated engagement prompts.

---

# 21. Database Mapping

The gamification model maps to:

```text
ExperienceLedger
UserProgression
PersonalRecord
Achievement
UserAchievement
AuditEvent
DataCorrection
```

## Source of Truth

- ExperienceLedger is the source of truth for experience.
- CompletedSet is the source of truth for set performance.
- WorkoutSession is the source of truth for workout completion.
- PersonalRecord references authoritative execution data.
- UserProgression is a calculated projection.
- UserAchievement stores awarded milestones.

---

# 22. MVP Calculation Configuration

The initial configuration is:

## Experience

```text
Workout completion: 100 XP
Completed exercise: 5 XP
Completed set: 2 XP
Set reward cap: 20 sets per workout
Standard personal record: 25 XP
Major personal record: 50 XP
Weekly target met: 50 XP
Meaningful partial week: 25 XP
Daily recovery registration: 5 XP
Habit completion: 3 XP
Habit daily cap: 15 XP
Measurement snapshot: 10 XP
Daily total cap: 500 XP
```

## Level

```text
XP required for level N = 100 × N × (N - 1)
```

## Attributes

```text
Performance range: 0–100
Consistency range: 0–100
Recovery range: 0–100
```

## Rolling Periods

```text
Consistency: 28 days
Recovery: 14 days
```

These values are initial product decisions.

They must be reviewed after real usage data becomes available.

---

# 23. Testing Requirements

Tests must cover:

- one reward per source event;
- duplicate synchronization;
- cancelled workout behavior;
- set reward cap;
- daily reward cap;
- habit reward cap;
- recovery reward uniqueness;
- measurement reward uniqueness;
- personal-record validation;
- estimated record formula version;
- correction adjustments;
- level calculation;
- achievement uniqueness;
- attribute calculation version;
- time zone boundaries;
- multi-device retries;
- unsafe or impossible values.

---

# 24. Analytics and Monitoring

Forge may monitor aggregate gamification behavior to evaluate product quality.

Useful metrics:

- percentage of completed workouts generating XP correctly;
- duplicate reward prevention;
- correction frequency;
- achievement distribution;
- attribute confidence distribution;
- average XP source distribution;
- synchronization-related reward failures.

Analytics must not include unnecessary raw health values.

---

# 25. Open Decisions

## OGD-001 — Major Personal Record Threshold

Define deterministic thresholds for major personal records.

## OGD-002 — Partial Workout Consistency

Define when partial workouts contribute to consistency.

## OGD-003 — Attribute Formula Validation

Validate attribute weights using real user data.

## OGD-004 — Experience Cap Behavior

Decide whether excess eligible XP is displayed as capped or simply omitted.

## OGD-005 — Achievement Final Catalog

Approve names, descriptions and exact thresholds.

## OGD-006 — Historical Recalculation

Define when new calculation versions apply to historical data.

## OGD-007 — Confidence Presentation

Define how low, medium and high confidence appear in the interface.

---

# 26. Definition of Done

Gamification is implemented successfully when:

- every reward is traceable;
- duplicate events do not duplicate rewards;
- levels derive from ledger totals;
- attributes are explainable;
- confidence reflects available data;
- personal records reference authoritative sets;
- cancelled workouts do not award completion XP;
- corrections remain auditable;
- caps prevent exploitative behavior;
- rest and inactivity do not remove permanent progress;
- no mechanic encourages unsafe behavior;
- celebrations remain proportional;
- calculation versions are stored and tested.

---

# 27. Specification Completion

This document defines the official gamification behavior for Forge version 1.

Implementation may optimize calculation and storage, but it must preserve:

- transparency;
- auditability;
- safety;
- deterministic progression;
- historical integrity;
- non-punitive behavior;
- user ownership.

Meaningful changes to formulas, event eligibility or safety rules must update this specification and, when architectural or strategic, be recorded through an ADR.

---

# End of Gamification Specification
