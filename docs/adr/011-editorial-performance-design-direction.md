# ADR-011 — Editorial Performance Design Direction

Status: Accepted

Date: 2026-08-03

---

# Context

Forge requires a visual direction that supports real workout execution, progress understanding and long-term trust.

Common fitness and SaaS design patterns introduce risks such as:

- excessive visual noise;
- generic dashboard layouts;
- overuse of cards;
- blue and purple technology gradients;
- game-like reward interfaces;
- aggressive fitness language;
- decorative analytics;
- poor one-handed usability.

Forge also needs a visual identity that is appropriate for a portfolio project without appearing artificially generated or overdesigned.

---

# Decision

Forge will use an editorial performance design direction.

The design will prioritize:

- typography;
- spacing;
- hierarchy;
- restrained color;
- action clarity;
- mobile-first interaction;
- accessible data visualization;
- complete offline and error states;
- calm and non-punitive language.

The initial color direction uses neutral surfaces with a controlled chartreuse accent rather than generic technology blue.

The active workout experience is the highest-priority interface.

Gamification remains visually secondary to real training progress.

Forge will avoid:

- generic SaaS KPI grids;
- blue-to-purple gradients;
- excessive glass effects;
- decorative 3D elements;
- fantasy game patterns;
- aggressive fitness clichés;
- unnecessary card containers;
- public competitive styling.

---

# Consequences

## Positive

- Forge develops a recognizable visual identity.
- Workout execution remains focused.
- The interface is less likely to resemble an AI-generated template.
- Typography and hierarchy improve readability.
- Gamification remains responsible.
- Dark and light themes can share a coherent system.
- Accessibility is treated as a visual requirement.
- Product states receive consistent treatment.

## Negative

- The restrained direction requires careful typography and spacing.
- Poor implementation quality will be more visible because decoration cannot hide inconsistencies.
- Custom design-system work is required.
- The accent palette must be validated carefully for contrast.
- Some familiar dashboard patterns are intentionally unavailable.

---

# Alternatives Considered

## Generic SaaS Dashboard

Rejected.

Reason:

KPI-card grids and standard admin layouts do not support Forge's action-first training experience or brand differentiation.

---

## Game-Oriented Fitness Interface

Rejected.

Reason:

Game-like visuals would overemphasize rewards and conflict with responsible gamification.

---

## Aggressive Athletic Branding

Rejected.

Reason:

Red-black palettes, military language and motivational pressure conflict with calm consistency and recovery principles.

---

## Minimal Neutral Interface Without Brand Accent

Rejected.

Reason:

A purely neutral system would be functional but insufficiently distinctive for the product identity.

---

## Glassmorphism and Gradient-Heavy Interface

Rejected.

Reason:

These patterns add decoration without improving clarity and are strongly associated with generic generated concepts.

---

# Rationale

Forge should feel like a focused performance journal and execution tool rather than a dashboard template or fitness game.

An editorial direction built from typography, spacing and disciplined hierarchy creates a premium identity while preserving usability during workouts.

The restrained chartreuse accent provides recognizable energy without relying on common technology conventions.

---

# Related Documents

- PROJECT-CONSTITUTION.md
- PRODUCT-VISION.md
- PRODUCT-AND-TECHNICAL-SPECIFICATION.md
- UX-FLOW.md
- GAMIFICATION-SPECIFICATION.md
- DESIGN-DIRECTION.md
