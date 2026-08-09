# Forge

> Build Strength. Track Progress.

Forge is a modern performance platform focused on physical evolution, training consistency and long-term progression.

Instead of being just another workout tracker, Forge is designed to transform structured training plans into a guided experience centered around performance, recovery and continuous improvement.

---

## Vision

Forge exists to help people become stronger through discipline and measurable progress.

Training is only one part of the journey.

The platform combines:

- Structured workout plans
- Progressive overload tracking
- Habit monitoring
- Personal records
- Performance analytics
- Gamified progression
- Offline workout sessions

Everything is built around one principle:

> Progress over perfection.

---

## Project Status

In Development

Current phase:

- [x] Product Definition
- [x] Technical Architecture
- [x] UX Flow
- [x] Database Modeling
- [x] Gamification Rules
- [x] Design Direction
- [x] Prototype (`prototype-v1`)
- [x] Backend Foundation (Phase 1)
- [x] Identity and Onboarding (Phase 2)
- [x] Training Definition (Phase 3)
- [x] Workout Execution (Phase 4)
- [x] Offline and PWA foundation (Phase 5)
- [x] Progress and Recovery (Phase 6)
- [x] Responsible Gamification (Phase 7)
- [x] Design Refinement (Phase 8)
- [ ] Production deployment (Phase 9) — Release candidate ready
- [x] React frontend and Django API integration
- [ ] Deployment

The official product experience is the React/TanStack application in `frontend/`, using the
Django modular backend in `backend/` as its source of truth for identity, training, progress,
recovery and experience.

Authentication includes account creation, session login, password recovery, authenticated
password changes and password-confirmed account deletion.

---

## Technology Stack

### Backend

- Python
- Django
- Gunicorn

### Web Experience

- React
- TanStack Router
- TypeScript
- Vite

### Database

- PostgreSQL

### Infrastructure

- Docker
- GitHub Actions

MVP production direction: Render for the Django web application and Supabase PostgreSQL for the
managed database. See `docs/adr/012-render-and-supabase-production-direction.md`.

---

## Architecture

Forge follows a Django modular monolith backend plus a React web frontend.

Core principles:

- Mobile First
- Offline First during workout sessions
- API-backed frontend
- Visual prototype as the UI source of truth
- Explicit Business Rules
- Testable Code
- Documentation First

---

## Documentation

Project documentation is located inside the `/docs` directory.

Current documents:

- Product & Technical Specification
- Design Direction
- Database Specification
- Gamification Specification
- UX Flow
- Architecture Decision Records

Documentation is considered the source of truth for every engineering decision.

---

## Principles

Forge follows these principles:

- Product before technology.
- Simplicity before complexity.
- Documentation before implementation.
- User experience before visual effects.
- Long-term maintainability over short-term speed.

---

## Repository Structure

```
Forge/
├── .github/
├── backend/
├── docker/
├── docs/
├── frontend/
├── AGENTS.md
└── README.md
```

- `docs/` contains the official product, UX, design, database and gamification specifications.
- `backend/` contains the official Django implementation. See [backend/README.md](backend/README.md).
- `frontend/` contains the official React/TanStack web application.
- root files apply to the whole Forge project.

To start the Phase 1 backend with Docker:

```powershell
Copy-Item backend/.env.example backend/.env
docker compose --env-file backend/.env -f docker/compose.yml up --build
```

To run the current Django development server using the configured `backend/.env`:

```powershell
.\run-dev.ps1
```

Then open the frontend at `http://127.0.0.1:5175/`. The API and Django admin run at
`http://127.0.0.1:8000/`.

Production configuration and release checks are documented in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## License

Private project.
