# HanLearn Project Specification

This document contains the detailed product and technical specification for HanLearn (repository name: **Chinese_Web**). The root [README.md](../README.md) is intentionally kept short for first-time visitors.

> **Status:** v0.1.0 MVP. This specification describes the current implementation and the next hardening priorities; it is not a promise that every planned item is production-complete.

## 1. Product scope

HanLearn is a self-hostable learning platform for Vietnamese speakers studying Simplified Chinese. The product is organized around:

- Structured courses and lessons.
- Listening, speaking, reading, and writing practice.
- Vocabulary, pinyin, Chinese characters, radicals, and grammar.
- HSK-oriented learning paths.
- Progress, spaced review, streaks, XP, achievements, and statistics.
- Administration tools for users, courses, lessons, content, HSK data, notifications, and media.

The default UI language is Vietnamese. Chinese learning content uses Simplified Chinese with pinyin and Vietnamese explanations.

### 1.1 Goals

1. Make a complete beginner-to-advanced learning foundation available as an open-source project.
2. Keep learning data and business rules in a server-side API backed by PostgreSQL.
3. Provide a maintainable codebase that teachers and contributors can extend.
4. Support local development, Docker deployment, and future production hardening.

### 1.2 Current non-goals

The current MVP does not claim to provide:

- A production-grade payment provider integration.
- A complete speech-recognition or pronunciation-scoring engine.
- Versioned production database migrations.
- A full multi-tenant SaaS control plane.
- Guaranteed production support or an SLA.

## 2. Users and permissions

| Role | Main responsibilities |
| --- | --- |
| Visitor | View the landing page and public course content. |
| Student | Learn courses, complete lessons, review vocabulary, track progress, and manage personal notes/bookmarks. |
| Teacher | Reserved content-authoring role; current admin content tools are primarily protected for administrators. |
| Administrator | Manage users, roles, courses, lessons, content blocks, HSK data, notifications, and media. |

Authorization is enforced by the API. Frontend route guards improve UX but are not a security boundary.

## 3. Functional requirements

### 3.1 Public experience

- Landing page with product positioning and course discovery.
- Published course list and course detail pages.
- Public vocabulary, characters, radicals, grammar, leaderboard, and skill content where supported by the API.
- Responsive desktop and mobile layouts.
- Search entry point and Ctrl/Cmd + K keyboard shortcut.

### 3.2 Identity and account

- Student registration with email, name, and password.
- Login with access-token issuance.
- Refresh-token session using an httpOnly cookie.
- Logout with refresh-token revocation.
- Current-user endpoint and client session bootstrap.
- Active-account check and role-aware access.
- Password hashing with bcryptjs.
- Account/profile, settings, notifications, and personal learning state.

### 3.3 Courses and lessons

A course contains ordered modules. A module contains ordered lessons. A lesson can contain:

- Introduction and summary sections.
- Vocabulary associations.
- Rich content blocks.
- Listening exercise and questions.
- Speaking prompt and attempts.
- Reading passage and questions.
- Writing prompt and expected answer.
- Quiz questions and answers.
- Completion and progress updates.

The lesson player exposes the learning sequence and provides previous, next, loading, empty, error, and completion states.

### 3.4 Vocabulary and review

Vocabulary records include Simplified Chinese, pinyin, Vietnamese meaning, part of speech, examples, and optional HSK metadata. Learner state includes:

- Learning/known status.
- Due-review timestamp.
- Review result and scheduling fields.
- Favorites, bookmarks, and notes.
- Vocabulary progress used by dashboard and statistics.

The current implementation provides a foundational spaced-repetition workflow. A more advanced scheduler is planned.

### 3.5 Four skills and Chinese reference

- **Listening:** transcript, translation, multiple-choice questions, and lesson integration.
- **Speaking:** prompts and attempt storage; provider-backed speech scoring is future work.
- **Reading:** passage, pinyin, Vietnamese translation, questions, answers, and explanations.
- **Writing:** Vietnamese prompt, expected Chinese answer, hint, and attempt foundation.
- **Characters:** glyph, pinyin, meaning, stroke count, HSK level, radical relationship, and examples.
- **Radicals:** glyph, Vietnamese name/meaning, stroke count, and frequency.
- **Grammar:** pattern, meaning, explanation, examples, common mistakes, and HSK level.
- **HSK:** level-based vocabulary and learning content.

### 3.6 Progress and motivation

- Course and lesson completion.
- Course, lesson, and vocabulary progress.
- Daily target and current level.
- Streak and longest streak.
- Experience points, experience log, achievements, leaderboard, and notifications.
- Statistics for activity and skill progress.

### 3.7 Administration

Protected admin routes support:

- Summary metrics.
- User listing, status changes, and role changes.
- Course creation and editing.
- Module and lesson CRUD.
- Lesson content-block CRUD and ordering.
- HSK overview.
- Notification listing and broadcast.
- Media upload and serving.

## 4. Frontend route map

| Route | Purpose |
| --- | --- |
| / | Landing page |
| /login, /register, /forgot-password | Authentication |
| /dashboard | Learner dashboard |
| /courses, /courses/:slug | Course catalog and detail |
| /lessons/:id | Lesson player |
| /vocabulary, /my-vocabulary, /review | Vocabulary and review |
| /listening, /speaking, /reading, /writing | Four skills |
| /characters, /radicals, /grammar, /hsk | Chinese reference and HSK |
| /statistics, /leaderboard | Progress and ranking |
| /notebook, /notifications, /search | Learner utilities |
| /profile, /settings | Account settings |
| /admin/* | Administrator workspaces |

## 5. System architecture

```text
Browser
  │
  ▼
React + Vite (apps/web)
  │ Axios, JSON, httpOnly refresh cookie
  ▼
Express API (apps/api)
  │ routes → middleware → controllers → services
  ▼
Prisma ORM
  │
  ▼
PostgreSQL
```

### 5.1 Technology choices

| Layer | Choice |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4 and project CSS |
| Client state/data | React Router, TanStack Query, Zustand, Axios |
| UI/form | React Hook Form, Zod, Lucide React, Recharts |
| Backend | Node.js 22, Express 4, TypeScript |
| Persistence | PostgreSQL 16, Prisma 6 |
| Security | JWT, bcryptjs, Helmet, CORS, rate limiting |
| Operations | Pino, Multer, Docker Compose, Nginx |
| Tests | Vitest |

### 5.2 Backend request flow

```text
HTTP request
  → route
  → authentication/role middleware
  → Zod validation
  → controller
  → service/business rule
  → Prisma query/transaction
  → response envelope
```

Controllers should remain thin. Business rules belong in services. Untrusted input is validated at the API boundary.

### 5.3 Repository layout

```text
apps/web/
  src/api/          API client and token refresh
  src/components/   shared layout and UI
  src/pages/        route-level screens
  src/stores/       Zustand stores

apps/api/
  prisma/           schema, seed, vocabulary and HSK data
  src/config/       environment parsing
  src/controllers/  HTTP adapters
  src/middleware/   auth, validation and errors
  src/routes/       endpoint registration
  src/services/     business logic
  src/utils/        tokens and HTTP helpers

ops/                Nginx and tunnel examples
docker-compose.yml  local stack
```

## 6. API specification

### 6.1 Response format

Successful responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Errors use the same top-level shape with success false, a human-readable message, and optional details.

Authenticated requests send:

```http
Authorization: Bearer <access-token>
```

The refresh token is stored in an httpOnly cookie scoped to the authentication routes.

### 6.2 Public and authentication endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /health | Health check |
| POST | /api/v1/auth/register | Register a student |
| POST | /api/v1/auth/login | Create a session |
| POST | /api/v1/auth/refresh | Rotate/refresh a session |
| POST | /api/v1/auth/logout | Revoke a session |
| GET | /api/v1/auth/me | Get the current user |
| GET | /api/v1/courses | List courses |
| GET | /api/v1/courses/:slug | Get course detail |
| GET | /api/v1/courses/lessons/:id | Get lesson detail |
| GET | /api/v1/vocabularies | List vocabulary |
| GET | /api/v1/leaderboard | Get leaderboard |
| GET | /api/v1/skills/:type | Get skill content |
| GET | /api/v1/characters | List characters |
| GET | /api/v1/radicals | List radicals |
| GET | /api/v1/grammar | List grammar |

### 6.3 Authenticated endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/v1/dashboard | Dashboard data |
| GET | /api/v1/reviews/due | Due vocabulary |
| POST | /api/v1/reviews/:id | Submit review result |
| GET | /api/v1/statistics | Personal statistics |
| GET | /api/v1/hsk | HSK content |
| POST | /api/v1/courses/lessons/:id/complete | Complete a lesson |

### 6.4 Admin and media endpoints

The /api/v1/admin/* routes require an access token and the admin role. They cover summary, users, courses, modules, lessons, content blocks, HSK, notifications, and broadcast operations.

POST /api/v1/media/upload accepts multipart/form-data and is restricted to administrators. Files are served under /api/v1/media/files from UPLOAD_DIR.

## 7. Data model

The Prisma schema currently includes:

- Identity: User, UserProfile, Role, Permission, UserRole, RefreshToken, AuditLog.
- Catalog: Course, CourseLevel, CourseCategory, Module, Lesson, LessonSection, LessonContentBlock.
- Learning content: Vocabulary, LessonVocabulary, GrammarPoint, Character, Radical, HskLevel, HskVocabulary.
- Exercises: listening, speaking, reading, writing, quizzes, questions, answers, and attempts.
- Progress: course/lesson/vocabulary progress, streaks, experience logs, achievements.
- Personalization: favorites, bookmarks, notes, notifications.
- Commercial foundation: subscriptions and payments.

Schema changes must be reviewed for indexes, constraints, cascade behavior, privacy, and migration/backfill risk.

## 8. Configuration

### 8.1 API environment

| Variable | Development default | Purpose |
| --- | --- | --- |
| NODE_ENV | development | Runtime mode |
| PORT | 5000 | API port |
| DATABASE_URL | Local PostgreSQL URL | Database connection |
| JWT_ACCESS_SECRET | Local placeholder | Access-token signing secret |
| JWT_REFRESH_SECRET | Local placeholder | Refresh-token signing secret |
| JWT_ACCESS_EXPIRES_IN | 15m | Access-token lifetime |
| JWT_REFRESH_EXPIRES_IN | 30d | Refresh-token lifetime |
| FRONTEND_URL | http://localhost:5173 | Allowed browser origin |
| UPLOAD_DIR | ./uploads | Media storage path |

### 8.2 Web environment

| Variable | Development default | Purpose |
| --- | --- | --- |
| VITE_API_URL | http://localhost:5000/api/v1 | API base URL embedded in the bundle |

Never place server secrets in VITE_* variables.

## 9. Local development

### 9.1 Requirements

- Node.js 22+ and npm.
- Docker Compose v2.
- PostgreSQL 16 when not using Docker.
- A modern browser.

### 9.2 Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

On Windows PowerShell, use Copy-Item instead of cp.

The web app runs at http://localhost:5173; the API runs at http://localhost:5000.

### 9.3 Commands

| Command | Purpose |
| --- | --- |
| npm run dev | Start web and API |
| npm run build | Build all workspaces |
| npm run typecheck | Type-check all workspaces |
| npm run lint | Run ESLint |
| npm test | Run tests |
| npm run db:generate | Generate Prisma Client |
| npm run db:migrate | Development prisma db push |
| npm run db:seed | Load reference/demo data |

### 9.4 Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | student@hanlearn.local | DemoPass123! |
| Teacher | teacher@hanlearn.local | DemoPass123! |
| Administrator | admin@hanlearn.local | DemoPass123! |

Demo credentials must never be used in public environments.

## 10. Security and privacy requirements

- Keep .env files, tokens, private keys, database dumps, uploads, and real learner data out of Git.
- Use high-entropy, environment-specific JWT secrets.
- Keep authentication and authorization on the server.
- Validate and constrain all input at API boundaries.
- Use secure cookies and HTTPS in production.
- Restrict CORS to the real frontend origin.
- Keep PostgreSQL and internal API ports private.
- Validate media type, size, name, and access permissions.
- Use backups, restore tests, centralized logs, monitoring, and alerting.
- Provide privacy, retention, terms-of-use, and deletion processes appropriate to the deployment.
- Follow [SECURITY.md](../SECURITY.md) for vulnerability reports.
- Follow [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) for community behavior.

## 11. Quality and acceptance criteria

A feature is ready for review when:

- TypeScript, lint, tests, and production build pass.
- Loading, empty, success, and error states are handled.
- API validation and authorization are covered.
- Sensitive fields are not returned unnecessarily.
- Schema changes include reviewed seed/migration impact.
- UI remains responsive and keyboard-accessible.
- Documentation and route/API contracts are updated.
- No secret, real personal data, or generated dependency directory is included.

Recommended verification:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The current development migration command uses prisma db push. Production must adopt reviewed, versioned migrations before handling real data.

## 12. Production readiness

Before a public deployment:

1. Replace all secrets, demo users, development domains, and local credentials.
2. Provision PostgreSQL with backup and restore procedures.
3. Adopt versioned database migrations.
4. Configure HTTPS, reverse proxy, secure cookies, CORS, rate limits, and private internal ports.
5. Harden upload storage and scanning.
6. Add observability, incident response, and security reporting workflows.
7. Publish privacy and data-retention documentation.
8. Run a security review and an end-to-end release checklist.

The production Compose override is a starting point only:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

## 13. Roadmap

- Versioned production migrations and safer release workflow.
- Integration and end-to-end coverage for auth, lessons, admin, and permissions.
- Advanced SRS scheduling, scoring, and recommendations.
- Speech/audio provider abstraction with explicit privacy controls.
- Teacher authoring, import/export, and content versioning.
- Observability, backup automation, and production runbooks.
- Accessibility, internationalization, and improved mobile experience.
