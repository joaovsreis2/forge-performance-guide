# DESIGN DIRECTION

Status: Approved

Version: 1.0.0

Owner: João Victor

Last Updated: 2026-08-09

Related Documents:

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
- DATABASE-SPECIFICATION.md
- GAMIFICATION-SPECIFICATION.md

---

# 1. Purpose

This document defines the official visual and interaction direction for Forge.

It translates product principles into concrete design rules for:

- hierarchy;
- typography;
- color;
- layout;
- spacing;
- navigation;
- training execution;
- data visualization;
- system states;
- motion;
- accessibility;
- responsive behavior;
- visual consistency.

This document does not define final production screens.

Its purpose is to ensure that future prototypes and implementation decisions remain aligned with the Forge product identity.

---

# 2. Design Positioning

Forge is a performance platform.

It must not look like:

- a generic fitness application;
- a social network;
- a cryptocurrency dashboard;
- a game interface;
- an AI-generated SaaS template;
- a corporate administration panel;
- a bodybuilding supplement brand;
- a medical monitoring system.

The interface should feel:

- focused;
- disciplined;
- calm;
- technical;
- reliable;
- premium;
- intentional;
- human.

The product should communicate progress without visual noise.

---

# 3. Core Visual Principle

The visual system follows one central idea:

> The interface should support the user's next action without competing for attention.

This means:

- content hierarchy is more important than decoration;
- typography is more important than card borders;
- spacing is more important than visual density;
- state clarity is more important than animation;
- progress context is more important than vanity metrics.

---

# 4. Brand Personality

Forge should express the following traits.

## 4.1 Disciplined

The interface is organized, consistent and intentional.

Nothing appears random.

---

## 4.2 Calm

Forge avoids visual urgency.

It does not pressure users through:

- aggressive countdowns;
- flashing warnings;
- red-heavy interfaces;
- exaggerated alerts;
- guilt-based messages.

---

## 4.3 Technical

Metrics are presented clearly and honestly.

The interface may feel analytical, but never cold or inaccessible.

---

## 4.4 Premium

Premium quality comes from:

- strong typography;
- restrained color;
- precise spacing;
- careful alignment;
- polished states;
- meaningful motion.

It does not come from excessive gradients, glass effects or 3D decoration.

---

## 4.5 Human

The product recognizes that users have:

- rest days;
- incomplete weeks;
- limited attention;
- interrupted workouts;
- different levels of experience.

The design language must remain supportive.

---

# 5. Anti-Patterns

The following patterns are prohibited unless explicitly justified.

## DP-001 — Generic SaaS Dashboard

Avoid:

- rows of identical KPI cards;
- oversized empty cards;
- every section inside a bordered container;
- dashboard layouts copied from admin templates.

---

## DP-002 — AI-Generated Visual Style

Avoid:

- blue-to-purple gradients;
- floating glass cards;
- excessive rounded rectangles;
- decorative blur everywhere;
- meaningless sparkles;
- generic abstract blobs;
- random neon glows;
- overdesigned hero sections.

---

## DP-003 — Game-Like Overload

Avoid:

- health bars;
- fantasy badges;
- treasure chests;
- coins;
- excessive confetti;
- cartoon mascots;
- competitive rank tiers;
- constant reward popups.

---

## DP-004 — Fitness Clichés

Avoid:

- flames;
- lightning bolts;
- muscular silhouettes;
- aggressive red and black combinations;
- motivational slogans in every screen;
- military language;
- “no excuses” messaging.

---

## DP-005 — Excessive Card Usage

Cards are used only when they provide:

- grouping;
- interaction;
- state separation;
- semantic containment.

Do not place every text block inside a card.

---

## DP-006 — Decorative Data

Charts and indicators must communicate useful information.

Do not include data visualization only to make the interface appear sophisticated.

---

# 6. Layout System

## 6.1 Mobile First

The base layout is designed for mobile.

Desktop adapts and expands the same information hierarchy.

The mobile experience is not a reduced desktop layout.

---

## 6.2 Content Width

Recommended maximum content widths:

```text
Mobile: full available width with safe horizontal padding
Tablet: 720–880 px
Desktop content: 1120–1280 px
Reading content: 680–760 px
```

Wide screens must not stretch text and forms excessively.

---

## 6.3 Grid

Recommended grid behavior:

```text
Mobile: 4 columns
Tablet: 8 columns
Desktop: 12 columns
```

The grid is a layout tool, not a visible design element.

---

## 6.4 Horizontal Padding

Recommended starting values:

```text
Small mobile: 16 px
Standard mobile: 20 px
Tablet: 24–32 px
Desktop: 32–48 px
```

Workout execution may use tighter spacing when it improves one-handed interaction.

---

## 6.5 Vertical Rhythm

Use consistent spacing intervals.

Recommended base scale:

```text
4
8
12
16
24
32
48
64
96
```

Avoid arbitrary spacing values unless required by optical alignment.

---

# 7. Typography

Typography is the primary visual identity of Forge.

## 7.1 Typeface Direction

Forge should use:

- a highly readable sans-serif for interface text;
- a distinctive but restrained display face only when it adds brand character;
- tabular numerals for workout values, timers and metrics.

The final font selection must consider:

- readability;
- language support;
- variable font availability;
- performance;
- licensing;
- numeric clarity.

## 7.2 Recommended Typeface Strategy

Primary interface candidates may include:

- Inter;
- Geist;
- IBM Plex Sans;
- Manrope;
- Source Sans 3.

Display typography may use the same family with stronger weight and tighter spacing.

A second font is optional, not required.

## 7.3 Type Scale

Recommended mobile scale:

```text
Display: 36–44 px
Page title: 28–32 px
Section title: 22–24 px
Subsection title: 18–20 px
Body: 16 px
Secondary body: 14 px
Caption: 12–13 px
Metric: context dependent, usually 28–56 px
```

## 7.4 Weight

Recommended weights:

```text
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
```

Avoid using bold text everywhere.

## 7.5 Line Height

Recommended:

```text
Headings: 1.1–1.25
Body: 1.45–1.65
Compact interface labels: 1.2–1.4
```

## 7.6 Numeric Typography

Timers, repetitions and weight values should use:

- tabular numerals;
- stable alignment;
- high contrast;
- clear units;
- no ambiguous decimal formatting.

---

# 8. Color System

Forge uses a restrained semantic color system.

The exact palette may evolve during visual prototyping, but the roles must remain stable.

## 8.1 Base Direction

The product should use:

- neutral backgrounds;
- strong readable foreground colors;
- one primary accent;
- limited semantic colors;
- subtle surface separation.

The primary accent should not default to generic SaaS blue.

## 8.2 Recommended Initial Palette

### Dark Theme

```text
Background: #0E0F11
Surface: #15171A
Elevated Surface: #1C1F23
Primary Text: #F4F5F6
Secondary Text: #A7ADB4
Muted Text: #737A82
Border: #2A2E33
Primary Accent: #D6FF4B
Accent Foreground: #11130A
```

### Light Theme

```text
Background: #F5F4F0
Surface: #FFFFFF
Elevated Surface: #ECEBE6
Primary Text: #171816
Secondary Text: #5D625D
Muted Text: #858A84
Border: #D9D8D2
Primary Accent: #668A00
Accent Foreground: #FFFFFF
```

The accent direction is a controlled lime or chartreuse tone associated with energy and progress without relying on common technology blue.

## 8.3 Semantic Colors

Recommended roles:

```text
Success
Warning
Error
Information
Offline
Pending Sync
Personal Record
```

Each semantic state must include:

- color;
- icon or shape;
- text label where needed.

Color alone must never communicate state.

## 8.4 Contrast

Text and interactive controls must meet WCAG AA contrast requirements.

Small text should target at least:

```text
4.5:1
```

Large text should target at least:

```text
3:1
```

Controls and meaningful graphics should target:

```text
3:1
```

---

# 9. Surface and Border Strategy

## 9.1 Background Layers

Use a small number of surface levels:

1. page background;
2. standard surface;
3. elevated or interactive surface;
4. modal or temporary overlay.

## 9.2 Borders

Borders should be subtle and purposeful.

Use them for:

- input boundaries;
- table separation;
- interactive grouping;
- state distinction.

Avoid visible borders around every container.

## 9.3 Shadows

Shadows should be rare.

Use shadows only when elevation communicates interaction or hierarchy.

Avoid large blurry shadows associated with generic landing pages.

---

# 10. Shape Language

## 10.1 Corner Radius

Use restrained corner radii.

Recommended scale:

```text
Small controls: 6–8 px
Inputs and buttons: 8–10 px
Cards and panels: 10–14 px
Large overlays: 14–18 px
```

Avoid making every element pill-shaped.

## 10.2 Pills

Pills are appropriate for:

- filters;
- compact statuses;
- selectable categories;
- tags.

Pills are not appropriate for every button or navigation item.

## 10.3 Dividers

Use whitespace before dividers.

A divider should clarify grouping, not compensate for poor spacing.

---

# 11. Iconography

Icons must be:

- simple;
- consistent;
- recognizable;
- secondary to labels;
- visually balanced.

Recommended direction:

- outlined or lightly filled;
- consistent stroke weight;
- no decorative 3D icons;
- no mixed icon families.

Critical actions should include text labels unless the icon is universally understood.

---

# 12. Navigation

## 12.1 Mobile Navigation

The primary mobile navigation may use a bottom navigation bar with:

- Today
- Plan
- Progress
- Account

Rules:

- maximum of four primary destinations;
- labels remain visible;
- the active destination is clear;
- gamification does not become a separate primary destination.

## 12.2 Desktop Navigation

Desktop may use:

- compact sidebar;
- top navigation;
- hybrid layout.

The information architecture must remain the same as mobile.

## 12.3 Active Workout

During an active workout:

- primary navigation is hidden or minimized;
- session controls become dominant;
- exit behavior is explicit;
- accidental navigation is prevented.

---

# 13. Today Experience

Today is the product entry point.

It must answer:

> What should I do now?

## 13.1 Priority Order

1. active workout;
2. scheduled workout;
3. relevant daily action;
4. meaningful progress;
5. secondary context.

## 13.2 Visual Structure

Today should use:

- strong page title or contextual greeting;
- one dominant action area;
- clear schedule state;
- minimal secondary modules;
- restrained progress context.

Avoid:

- a dense grid of metrics;
- multiple competing charts;
- generic KPI cards.

## 13.3 Rest Day

Rest day presentation should feel intentional.

Use:

- calm language;
- recovery action;
- next workout context;
- optional recent progress.

Do not show failure colors.

---

# 14. Workout Preview

The workout preview must communicate:

- workout name;
- focus;
- exercise count;
- estimated duration when reliable;
- key notes;
- exercise order;
- primary Start Workout action.

The start action must be visually dominant.

Secondary information should not create friction before training.

---

# 15. Active Workout Design

The active workout is the most important interface in Forge.

## 15.1 Visual Priority

1. current exercise;
2. current set;
3. target;
4. previous relevant result;
5. input;
6. Complete Set action;
7. progress through the workout;
8. secondary technique content.

## 15.2 Interaction Density

The active set area may use higher density than the rest of the product.

However, controls must remain:

- large;
- readable;
- one-hand accessible;
- stable during input.

## 15.3 Set Input

Numeric inputs should support:

- direct keyboard entry;
- increment and decrement;
- reuse of previous value;
- clear units;
- visible validation;
- stable alignment.

## 15.4 Complete Set Action

The primary action should be:

- large;
- easy to reach;
- clearly labeled;
- visually distinct;
- protected against duplicate submissions.

## 15.5 Exercise Progress

Display progress through:

- current exercise position;
- set completion;
- overall workout completion.

Avoid large decorative circular progress charts when a simple linear indicator is clearer.

## 15.6 Technique Notes

Technique notes should be secondary.

They may appear through:

- expandable section;
- bottom sheet;
- contextual drawer.

Opening notes must not lose input state.

---

# 16. Rest Timer

The rest timer should be:

- immediately readable;
- visually stable;
- easy to skip;
- compatible with background operation;
- available without leaving workout context.

## 16.1 Timer Typography

Use large tabular numerals.

The timer should not rely on animation for comprehension.

## 16.2 Timer States

Possible states:

- running;
- paused;
- completed;
- skipped.

## 16.3 Feedback

Timer completion may use:

- vibration;
- sound;
- visible state change.

All feedback respects user settings.

---

# 17. Workout Summary

The summary should feel rewarding but grounded.

## 17.1 Priority

1. workout completed;
2. duration;
3. exercises and sets;
4. personal records;
5. meaningful progress;
6. experience;
7. skipped work;
8. notes.

## 17.2 Celebration

Use restrained celebration.

Appropriate:

- subtle motion;
- focused highlight;
- concise milestone message;
- progress transition.

Avoid:

- constant confetti;
- full-screen game rewards;
- multiple consecutive modals;
- exaggerated sound.

## 17.3 Offline Completion

If synchronization is pending, show:

- completion success;
- local-save confirmation;
- pending sync status.

Do not make the user feel the workout was lost.

---

# 18. Progress Experience

Progress should explain change over time.

It must not become a generic analytics dashboard.

## 18.1 Information Hierarchy

Recommended order:

1. recent meaningful change;
2. exercise progress;
3. personal records;
4. consistency;
5. recovery;
6. measurements;
7. detailed history.

## 18.2 Metric Presentation

Each metric should include:

- label;
- current value;
- period;
- context;
- explanation when calculated.

## 18.3 Attributes

Performance, Consistency and Recovery should appear as separate dimensions.

Avoid radar charts by default.

Prefer:

- individual bars;
- clear scores;
- trend context;
- confidence labels;
- explanatory text.

## 18.4 Levels and Experience

Experience should support progress understanding.

It should not visually dominate real training metrics.

---

# 19. Data Visualization

## 19.1 General Rules

Charts must:

- answer a clear question;
- show units;
- define time period;
- provide accessible text alternatives;
- avoid misleading scales;
- display insufficient-data states.

## 19.2 Line Charts

Use for:

- weight progression;
- repetition progression;
- measurements;
- attribute trends.

## 19.3 Bar Charts

Use for:

- weekly volume;
- workout frequency;
- completed versus planned work.

## 19.4 Progress Bars

Use for:

- workout completion;
- level progress;
- weekly target progress.

## 19.5 Avoid

Avoid:

- decorative donut charts;
- 3D charts;
- gauges without clear meaning;
- charts with excessive colors;
- hidden axes;
- overly smoothed trends;
- comparisons between incompatible metrics.

---

# 20. Forms and Inputs

## 20.1 Labels

Every input must have a persistent label.

Placeholder text does not replace a label.

## 20.2 Validation

Validation must be:

- specific;
- close to the field;
- non-destructive;
- visible without color alone.

## 20.3 Numeric Inputs

Numeric input patterns must account for:

- mobile keyboards;
- decimal separators;
- units;
- range validation;
- previous-value reuse.

## 20.4 Optional Fields

Optional fields must be explicitly marked.

Do not mark every required field with an asterisk when most fields are required.

---

# 21. Buttons and Actions

## 21.1 Primary Button

Use one primary action per state.

## 21.2 Secondary Button

Use for alternative but valid actions.

## 21.3 Tertiary Action

Use for low-priority actions such as:

- view details;
- skip;
- cancel navigation.

## 21.4 Destructive Action

Destructive actions use:

- clear wording;
- semantic warning;
- confirmation when necessary.

Avoid ambiguous labels such as:

```text
OK
Continue
Yes
```

Prefer:

```text
Cancel Workout
Delete Account
Discard Changes
```

---

# 22. System States

## 22.1 Loading

Use:

- skeletons for stable known layouts;
- progress indicators for blocking operations;
- descriptive labels for longer operations.

Do not display fake loading animation for instant operations.

## 22.2 Empty

An empty state includes:

- concise explanation;
- relevance;
- primary next action.

## 22.3 Error

Errors include:

- what failed;
- whether data was preserved;
- next action.

## 22.4 Offline

Offline states use a consistent indicator.

The indicator must distinguish:

- offline but safe;
- pending sync;
- failed sync;
- action unavailable offline.

## 22.5 Success

Routine success uses subtle confirmation.

Major success uses a dedicated but restrained moment.

---

# 23. Notifications and Messaging

## 23.1 Tone

Messages should be:

- clear;
- calm;
- direct;
- respectful;
- non-judgmental.

## 23.2 Examples

Avoid:

```text
You failed your goal.
You lost your streak.
No excuses.
You are falling behind.
```

Prefer:

```text
Your workout is ready when you are.
This session was saved on your device.
You can continue from where you stopped.
Recovery is part of progress.
```

## 23.3 Toasts

Use toasts only for low-risk transient feedback.

Do not use toasts for:

- critical errors;
- destructive confirmation;
- information the user must remember.

---

# 24. Motion

Motion must clarify state or hierarchy.

## 24.1 Appropriate Motion

Use motion for:

- state transitions;
- workout progression;
- bottom-sheet entry;
- value confirmation;
- milestone emphasis.

## 24.2 Timing

Recommended ranges:

```text
Micro interaction: 120–180 ms
Standard transition: 180–260 ms
Large transition: 260–400 ms
```

## 24.3 Easing

Use natural deceleration.

Avoid elastic or playful motion in critical workout interactions.

## 24.4 Reduced Motion

All non-essential animation must respect reduced-motion preferences.

---

# 25. Responsive Behavior

## 25.1 Mobile

Priority:

- one-handed use;
- bottom-reachable actions;
- compact navigation;
- focused content.

## 25.2 Tablet

May introduce:

- wider workout context;
- split details;
- persistent secondary information.

## 25.3 Desktop

May introduce:

- multi-column progress layouts;
- persistent sidebar;
- larger historical views.

Desktop must not increase cognitive noise only because more space exists.

---

# 26. Accessibility

Forge targets WCAG 2.2 AA.

## 26.1 Required Practices

- semantic HTML;
- keyboard navigation;
- visible focus;
- descriptive labels;
- adequate contrast;
- non-color state indicators;
- screen-reader announcements;
- reduced-motion support;
- logical heading hierarchy;
- accessible chart summaries;
- minimum touch target size.

## 26.2 Touch Targets

Recommended minimum:

```text
44 × 44 px
```

Critical workout controls may be larger.

## 26.3 Focus

Focus states must be visible in both themes.

Do not remove outlines without an equivalent replacement.

## 26.4 Live Feedback

Set completion, timer completion and synchronization changes should be announced accessibly when relevant.

---

# 27. Theme Strategy

Forge should support dark and light themes.

## Dark Theme

The dark theme is recommended as the primary visual direction because it:

- reduces glare in gym environments;
- supports strong metric contrast;
- aligns with the focused performance identity.

It must not use pure black for every surface.

## Light Theme

The light theme should remain warm and neutral.

Avoid sterile white-and-blue SaaS styling.

## Theme Parity

Both themes must support:

- equal readability;
- equal semantic clarity;
- equal accessibility;
- identical feature access.

---

# 28. Component Direction

Forge should develop a small internal design system.

Initial components may include:

- AppShell
- PageHeader
- PrimaryNavigation
- BottomNavigation
- Button
- IconButton
- Input
- NumericInput
- Select
- Checkbox
- Switch
- StatusBadge
- ProgressBar
- WorkoutHeader
- ExerciseSetRow
- RestTimer
- MetricSummary
- ChartContainer
- EmptyState
- ErrorState
- OfflineIndicator
- SyncStatus
- Modal
- BottomSheet
- Toast

Component names describe responsibility, not visual appearance.

---

# 29. Content Density

Forge uses three density modes.

## Standard

Used for:

- Today;
- profile;
- settings;
- onboarding.

## Compact

Used for:

- history tables;
- exercise lists;
- detailed progress views.

## Workout

Used for:

- active exercise;
- set entry;
- rest timer.

Workout density prioritizes immediate action over supporting information.

---

# 30. Design Review Checklist

Before approving any screen, verify:

- Is the primary action obvious?
- Does the screen support the current journey?
- Is the mobile hierarchy correct?
- Is there unnecessary card usage?
- Is information duplicated?
- Are metrics explained?
- Are offline and error states defined?
- Is the interface usable with one hand?
- Does color meet contrast requirements?
- Does the design avoid generic SaaS patterns?
- Is motion purposeful?
- Is the language non-punitive?
- Are historical and active states visually distinct?
- Is gamification secondary to real progress?

---

# 31. MVP Screen Inventory

The initial design must cover:

## Global

- Branded application launch

## Authentication

- Sign In
- Create Account
- Password Recovery
- Password Reset

## Onboarding

- Profile Setup
- Training Goal
- Physical Information
- Plan Setup Status

## Today

- Active Workout
- Scheduled Workout
- Rest Day
- No Plan
- Workout Completed

## Training

- Plan Overview
- Workout Preview
- Active Exercise
- Rest Timer
- Pause or Leave
- Incomplete Workout Confirmation
- Workout Summary

## Progress

- Progress Overview
- Training History
- Session Detail
- Exercise Progress
- Personal Records
- Recovery
- Measurements
- Gamification Detail

## Account

- Profile
- Preferences
- Security
- Appearance
- Sign Out
- Account Deletion

## System States

- Offline
- Pending Sync
- Sync Failed
- Empty
- Error
- Permission Denied
- Loading

---

# 32. Prototype Requirements

The first high-fidelity prototype should prioritize:

1. Today with scheduled workout;
2. workout preview;
3. active exercise;
4. rest timer;
5. workout completion;
6. workout summary;
7. Progress overview;
8. offline and pending-sync states.

The prototype must demonstrate:

- mobile-first hierarchy;
- one-hand interaction;
- real numeric inputs;
- active workout continuity;
- restrained gamification;
- non-generic visual identity.

---

# 33. Open Design Decisions

## ODD-001 — Final Typeface

Select and validate the production typeface.

## ODD-002 — Final Accent Color

Validate the proposed chartreuse direction across light and dark themes.

## ODD-003 — Navigation Pattern

Confirm bottom navigation on mobile and sidebar or top navigation on desktop.

## ODD-004 — Active Set Layout

Prototype alternatives for numeric inputs and set completion.

## ODD-005 — Progress Attribute Presentation

Validate bars, scores, confidence and trend presentation.

## ODD-006 — Exercise Media

Define the visual treatment for technique images or videos.

## ODD-007 — Celebration Motion

Define level-two and level-three celebration patterns.

## ODD-008 — Data Visualization Library

Select a chart implementation compatible with accessibility and server-rendered pages.

---

# 34. Definition of Done

The design direction is successfully implemented when:

- Forge has a recognizable and restrained visual identity;
- the interface does not resemble a generic AI-generated dashboard;
- Today prioritizes the next action;
- active workout interaction is fast and one-hand friendly;
- gamification supports rather than dominates progress;
- charts communicate clear questions;
- system states are visually complete;
- dark and light themes meet accessibility requirements;
- responsive layouts preserve hierarchy;
- components remain consistent;
- motion is purposeful and optional;
- language remains calm and non-punitive.

---

# 35. Specification Completion

This document defines the official design direction for Forge version 1.

Visual prototypes and implementation may evolve, but they must preserve:

- product hierarchy;
- brand personality;
- restrained visual language;
- action-first design;
- accessibility;
- mobile-first behavior;
- historical clarity;
- responsible gamification;
- system-state completeness.

Meaningful changes to the visual strategy must update this document and, when strategic, be recorded through an ADR.

---

# End of Design Direction
