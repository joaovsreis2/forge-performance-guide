# Forge Prototype

Create a high-fidelity interactive prototype for a fitness performance platform called Forge.

This is a prototype phase only. Do not configure Supabase, authentication providers, payment systems, external APIs, or production backend infrastructure. Use realistic local mock data and client-side state. The goal is to validate UX, visual direction, navigation, active workout behavior, offline states, and progress presentation before the real Django implementation begins.

PRODUCT POSITIONING

Forge is not a generic workout tracker. It is a calm, disciplined performance platform focused on structured training, measurable progression, consistency, recovery, and trustworthy historical data.

The product should feel:

- focused;
- premium;
- technical;
- calm;
- intentional;
- human;
- reliable.

It must not look like:

- an AI-generated SaaS dashboard;
- a generic admin panel;
- a social fitness app;
- a game interface;
- a cryptocurrency dashboard;
- a bodybuilding supplement brand.

VISUAL DIRECTION

Use a mobile-first editorial performance design.

Primary visual principles:

- typography and hierarchy before decoration;
- whitespace before excessive containers;
- one clear primary action per state;
- restrained card usage;
- strong numeric typography with tabular numerals;
- calm motion;
- meaningful status feedback;
- real progress should visually dominate gamification.

Avoid:

- blue-to-purple gradients;
- glassmorphism;
- random neon glows;
- oversized rounded cards everywhere;
- rows of KPI cards;
- 3D illustrations;
- fantasy badges;
- health bars;
- public rankings;
- aggressive red-and-black gym branding;
- flames, lightning, muscular silhouettes, and “no excuses” language.

COLOR DIRECTION

Start with a dark-first theme:

- page background: #0E0F11;
- standard surface: #15171A;
- elevated surface: #1C1F23;
- primary text: #F4F5F6;
- secondary text: #A7ADB4;
- muted text: #737A82;
- border: #2A2E33;
- primary accent: #D6FF4B;
- accent foreground: #11130A.

Use the chartreuse accent sparingly for primary actions, progress, active states, and important highlights. Do not flood the interface with it.

Include a functional light-theme toggle using warm neutrals rather than sterile white-and-blue SaaS styling.

TYPOGRAPHY

Use a readable modern sans-serif such as Geist, Inter, IBM Plex Sans, Manrope, or a comparable typeface. Use strong typographic hierarchy and tabular numerals for weights, repetitions, timers, and progress values.

NAVIGATION

Primary mobile navigation has exactly four destinations:

- Today;
- Plan;
- Progress;
- Account.

Use a compact bottom navigation with persistent text labels. During an active workout, hide or minimize the primary navigation so the workout becomes the dominant context.

PROTOTYPE SCOPE

Build the following connected screens and states.

1. SIGN IN

- Forge wordmark or restrained symbol placeholder;
- email and password;
- primary “Sign in” action;
- secondary password-recovery and create-account actions;
- calm, minimal layout.

2. ONBOARDING
   Create a short multi-step flow:

- profile setup;
- primary training goal;
- basic physical information;
- training-plan setup status;
- onboarding completion.

Do not turn onboarding into a long tutorial.

3. TODAY
   Create multiple switchable Today states for prototype review:

- scheduled workout;
- active workout;
- rest day;
- no active plan;
- workout already completed.

The main scheduled-workout state must prioritize:

- concise contextual greeting;
- workout name;
- training focus;
- exercise count;
- estimated duration;
- one dominant “Start workout” action;
- small recent-progress context;
- optional recovery action.

Do not use a KPI-card grid.

4. PLAN
   Show:

- active plan name;
- weekly structure;
- workout days;
- exercise order;
- sets, repetition ranges, rest intervals, and technical notes;
- plan is read-only in the MVP.

5. WORKOUT PREVIEW
   Show:

- workout name and focus;
- exercise count;
- estimated duration;
- ordered exercise list;
- relevant technical note;
- large primary “Start workout” action.

6. ACTIVE WORKOUT
   This is the most important screen.

Prioritize:

- current exercise name;
- exercise position in the workout;
- current set;
- target repetitions or metric;
- previous relevant result;
- large editable weight and repetitions controls;
- one large bottom-reachable “Complete set” action;
- overall workout progress;
- technique notes available on demand;
- skip set and skip exercise as secondary actions.

Make numeric entry realistic and interactive. Include plus/minus controls and direct input. Repeated taps must feel protected from duplicate submission.

Use realistic sample data such as:

- Bench Press — 4 sets — 8 to 10 reps — 90 seconds rest;
- Barbell Row — 4 sets — 8 to 12 reps;
- Incline Dumbbell Press — 3 sets — 10 to 12 reps;
- Lateral Raise — 3 sets — 12 to 15 reps.

7. REST TIMER
   Create an active rest-timer state with:

- large tabular countdown;
- next-set context;
- “Continue now” action;
- “Add 30 seconds” secondary action;
- sound and vibration status;
- no game-like visual treatment.

8. PAUSE AND LEAVE FLOW
   Create a bottom sheet or modal with:

- Resume later;
- Cancel workout;
- Stay in workout.

Cancellation requires a second explicit confirmation that explains what will be preserved.

9. OFFLINE AND SYNCHRONIZATION STATES
   Create clearly distinguishable states:

- offline but workout safely stored;
- pending synchronization;
- syncing;
- synchronization failed;
- synchronized.

Use text, iconography, and color together. Color alone must not communicate the state.

The prototype should demonstrate that a set can be completed offline and later synchronized.

10. WORKOUT COMPLETION
    Create an incomplete-workout confirmation state and a successful completion state.

The successful summary should prioritize:

- completion confirmation;
- duration;
- exercises and sets completed;
- skipped work;
- personal record when applicable;
- XP breakdown;
- level progress;
- pending-sync message when offline.

Celebration should be restrained and meaningful, not confetti-heavy.

11. PROGRESS
    Create a progress overview that avoids a generic analytics dashboard.

Prioritize:

- one recent meaningful change;
- exercise progress;
- personal records;
- consistency;
- recovery;
- measurements;
- training history.

Display Performance, Consistency, and Recovery as separate explainable dimensions. Do not use a radar chart. Use individual bars, scores, trend context, and confidence labels.

Use realistic sample values:

- Performance: 68, medium confidence;
- Consistency: 82, high confidence;
- Recovery: 61, medium confidence.

12. EXERCISE PROGRESS
    Show:

- selected exercise;
- current relevant performance;
- recent sessions;
- a clear line chart;
- personal record;
- textual explanation of the chart;
- period selector.

13. TRAINING HISTORY
    Show:

- completed sessions;
- cancelled session example;
- date;
- workout name;
- duration;
- completion state;
- session detail with immutable historical snapshot styling.

Historical screens must look clearly different from the active workout.

14. RECOVERY AND HABITS
    Create a low-friction daily form for:

- sleep duration;
- hydration;
- cardio or mobility completion;
- daily habits.

Missing data must not appear as failure.

15. BODY MEASUREMENTS
    Create:

- measurement history;
- add-measurement flow;
- weight and optional circumference fields;
- simple trend presentation;
- no judgmental language;
- no reward based on losing or gaining weight.

16. GAMIFICATION DETAIL
    Show:

- level;
- total XP;
- progress to next level;
- recent XP ledger entries;
- achievements;
- Performance, Consistency, and Recovery explanations.

Example XP ledger:

- Workout completed: +100 XP;
- 8 valid sets: +16 XP;
- New repetition record: +25 XP;
- Recovery recorded: +5 XP.

Gamification must remain visually secondary to actual training progress.

17. ACCOUNT
    Create:

- profile;
- units;
- time zone;
- theme;
- sound and vibration;
- notification preferences;
- security;
- sign out;
- destructive account-deletion entry.

SYSTEM STATES

Implement reusable visual states for:

- loading;
- empty;
- error;
- permission denied;
- offline;
- pending synchronization;
- synchronization failure;
- success.

Every error must explain:

- what failed;
- whether data was preserved;
- what the user can do next.

ACCESSIBILITY

Target WCAG 2.2 AA:

- strong contrast;
- visible focus;
- semantic structure;
- keyboard support;
- screen-reader labels;
- minimum 44 × 44 px touch targets;
- reduced-motion support;
- non-color status indicators;
- accessible chart summaries.

RESPONSIVE BEHAVIOR

Design mobile first around a modern phone viewport. Also create responsive desktop behavior without changing the information architecture. Desktop may use a compact sidebar, wider history views, and two-column progress layouts, but must not add visual noise simply because more space is available.

INTERACTION REQUIREMENTS

The prototype must be navigable and interactive. Include:

- working bottom navigation;
- sign-in to onboarding to Today flow;
- Today to workout preview;
- workout preview to active workout;
- set completion to rest timer;
- timer to next set;
- pause and cancellation dialogs;
- offline state toggle or simulated connection loss;
- workout completion to summary;
- navigation to Progress, Plan, and Account;
- dark/light theme toggle.

Use local mock state only. Persist prototype progress in local storage when useful so refreshing does not destroy the active-workout demonstration.

CONTENT STYLE

The interface copy should be concise, calm, direct, and supportive.

Avoid:

- “You failed”;
- “No excuses”;
- “You lost your streak”;
- “You are falling behind.”

Prefer:

- “Your workout is ready when you are.”;
- “This session was saved on your device.”;
- “You can continue from where you stopped.”;
- “Recovery is part of progress.”

FINAL EXPECTATION

Create a polished high-fidelity product prototype, not a landing page and not a technical admin dashboard.

The result should feel distinctive enough for a professional software-engineering portfolio while remaining realistic to implement later using Django Templates, HTMX, Tailwind CSS, Alpine.js when necessary, JavaScript, and Chart.js.

Do not configure a real backend. Do not add Supabase. Do not add authentication integrations. Do not add payment features. Do not broaden the scope beyond the screens and states described above.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f9697e29-61b2-4c89-b727-30da452b49b5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
cd prototype
npm i
npm run dev
```
