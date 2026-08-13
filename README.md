# HanLearn — Chinese Learning Platform

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-339933.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

HanLearn (repository name: **Chinese_Web**) is an open-source Chinese-learning platform for Vietnamese learners. It combines structured courses, four-skill practice, vocabulary review, HSK preparation, Chinese characters, grammar, learning progress, and an administration area in one self-hostable application.

The default interface language is Vietnamese and the learning content uses Simplified Chinese. The project is intended for learners, teachers, developers, and organizations that want to run or extend a community-oriented language-learning product.

> **Project status:** `v0.1.0` — active MVP development. The current source is suitable for local development, education, and experimentation. Read the production notes before exposing an instance to the public Internet.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Docker development](#docker-development)
- [Demo accounts](#demo-accounts)
- [Available scripts](#available-scripts)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Database and seed data](#database-and-seed-data)
- [Testing and quality checks](#testing-and-quality-checks)
- [Production deployment](#production-deployment)
- [Security and privacy](#security-and-privacy)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Features

### Learning experience

- Landing page and course catalog.
- Registration, login, refresh sessions, logout, and current-user profile.
- Learner dashboard with course progress, streak, XP, achievements, and recent activity.
- Course details, modules, lessons, lesson content blocks, and lesson completion.
- Four-skill learning flows: listening, speaking, reading, and writing.
- Vocabulary with Simplified Chinese, pinyin, Vietnamese meaning, examples, and review status.
- Due-review workflow based on a foundational spaced-repetition model.
- HSK practice and level-based learning content.
- Chinese characters, radicals, and grammar reference pages.
- Statistics, leaderboard, notebook, favorites/bookmarks, notifications, and profile screens.
- Responsive layout, dark mode, loading states, empty states, and error states.
- Keyboard shortcut `Ctrl/Cmd + K` for in-app search.

### Administration

- Admin dashboard and summary metrics.
- User management, account status, and role management.
- Course, module, lesson, and lesson-content CRUD.
- HSK overview and notification broadcast.
- Protected media upload for administrators.

### Backend capabilities

- Versioned REST API under `/api/v1`.
- Clear route → middleware → controller → service → Prisma → PostgreSQL flow.
- JWT access tokens and hashed refresh-token records.
- Password hashing with `bcryptjs`.
- Zod validation, Helmet security headers, CORS with credentials, and rate limiting.
- Pino HTTP logging.
- Consistent JSON response envelope: `{ success, message, data }`.

## Technology stack

| Area | Technology |
| --- | --- |
| Web | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4 and project CSS |
| Client state/data | React Router, TanStack Query, Zustand, Axios |
| Forms/UI | React Hook Form, Zod, Lucide React, Recharts |
| API | Node.js 22, Express 4, TypeScript |
| Persistence | PostgreSQL 16 and Prisma 6 |
| Authentication | JWT, bcryptjs, httpOnly refresh cookie |
| Security/operations | Helmet, CORS, express-rate-limit, Pino, Multer |
| Testing | Vitest |
| Local infrastructure | Docker Compose and Nginx |
| License | Apache License 2.0 |

## Architecture

```text
Browser
  │
  ▼
React + Vite (apps/web)
  │ Axios / JSON API
  ▼
Express API (apps/api)
  │ routes → middleware → controllers → services
  ▼
Prisma ORM
  │
  ▼
PostgreSQL
```

The browser owns presentation and client state. The API owns authentication, authorization, validation, business rules, progress updates, review logic, and persistence.

## Repository layout

```text
Chinese_Web/
├── apps/
│   ├── web/                         # React/Vite frontend
│   │   ├── src/
│   │   │   ├── api/                 # Axios client and token refresh flow
│   │   │   ├── components/          # Layout, UI primitives, shared states
│   │   │   ├── pages/               # Route-level screens
│   │   │   ├── stores/              # Zustand stores
│   │   │   └── styles.css
│   │   ├── public/                  # Public assets, robots, sitemap
│   │   └── package.json
│   └── api/                         # Express API
│       ├── prisma/
│       │   ├── schema.prisma        # Database model
│       │   ├── seed.ts              # Reference/demo data
│       │   └── chinese-*.ts         # Vocabulary and HSK data
│       ├── src/
│       │   ├── config/              # Environment validation
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── services/
│       │   └── utils/
│       └── package.json
├── docker-compose.yml               # Local full stack
├── docker-compose.production.yml    # Production override
├── ops/                             # Nginx and tunnel examples
├── package.json                     # npm workspace scripts
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Requirements

- Node.js `22` or newer and npm.
- Docker Desktop or Docker Engine with Docker Compose v2.
- PostgreSQL `16` when running the database outside Docker.
- A modern browser with ES modules, Web Crypto, and HTML5 audio/video support.

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/DucQuyen199/Chinese_Web.git
cd Chinese_Web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment files

macOS/Linux:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Do not commit `.env` files. The example files contain development placeholders only.

### 4. Start PostgreSQL

With Docker:

```bash
docker compose up -d postgres
```

Or use an existing PostgreSQL instance and update `DATABASE_URL` in `apps/api/.env`.

### 5. Generate the client and load development data

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

In the current MVP, `npm run db:migrate` runs `prisma db push` for development schema synchronization. This is not a versioned production migration workflow; see [Production deployment](#production-deployment).

### 6. Start the web app and API

```bash
npm run dev
```

Default endpoints:

| Service | URL |
| --- | --- |
| Web | <http://localhost:5173> |
| API | <http://localhost:5000> |
| Health check | <http://localhost:5000/health> |
| API base URL | <http://localhost:5000/api/v1> |

## Docker development

Build and start the full stack:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up -d --build
```

Stop the stack:

```bash
docker compose down
```

To reset local database volumes:

```bash
docker compose down -v
```

`docker compose down -v` permanently removes the local PostgreSQL volume and its data. Use it only when a database reset is intentional.

## Demo accounts

The development seed creates these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@hanlearn.local` | `DemoPass123!` |
| Teacher | `teacher@hanlearn.local` | `DemoPass123!` |
| Administrator | `admin@hanlearn.local` | `DemoPass123!` |

These credentials are for local demonstrations only. Disable or replace all demo accounts and passwords before deploying publicly.

## Available scripts

Run from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API and web app concurrently |
| `npm run build` | Build all workspaces |
| `npm run typecheck` | Type-check all workspaces |
| `npm run lint` | Run ESLint in all workspaces |
| `npm test` | Run all workspace tests |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run `prisma db push` for development |
| `npm run db:seed` | Load reference data and demo accounts |

Run a command in one workspace:

```bash
npm run dev --workspace @hanlearn/web
npm run dev --workspace @hanlearn/api
npm run test --workspace @hanlearn/web
npm run test --workspace @hanlearn/api
```

## Environment variables

### API: `apps/api/.env`

| Variable | Development default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `5000` | Express API port |
| `DATABASE_URL` | Local PostgreSQL URL | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Local placeholder | Secret used for access tokens |
| `JWT_REFRESH_SECRET` | Local placeholder | Secret used for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access-token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh-token lifetime |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed browser origin |
| `UPLOAD_DIR` | `./uploads` | Media upload directory |

Generate new, high-entropy values for both JWT secrets in every non-local environment. Never use the example values in production.

### Web: `apps/web/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api/v1` | API base URL embedded in the web build |

Every `VITE_*` value is exposed to the browser. Do not put passwords, private keys, database credentials, or server-only secrets in these variables.

## API overview

Successful responses use this envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Authenticated requests send the access token in the following header:

```http
Authorization: Bearer <access-token>
```

### Public and authentication endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/api/v1/auth/register` | Register a student |
| `POST` | `/api/v1/auth/login` | Log in |
| `POST` | `/api/v1/auth/refresh` | Issue a new access token from the refresh cookie |
| `POST` | `/api/v1/auth/logout` | Revoke the refresh session |
| `GET` | `/api/v1/auth/me` | Get the current user |
| `GET` | `/api/v1/courses` | List published courses |
| `GET` | `/api/v1/courses/:slug` | Get a course |
| `GET` | `/api/v1/courses/lessons/:id` | Get a lesson |
| `GET` | `/api/v1/vocabularies` | List vocabulary |
| `GET` | `/api/v1/leaderboard` | Get the leaderboard |
| `GET` | `/api/v1/skills/:type` | Get skill content |
| `GET` | `/api/v1/characters` | List Chinese characters |
| `GET` | `/api/v1/radicals` | List radicals |
| `GET` | `/api/v1/grammar` | List grammar points |

### Authenticated endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/dashboard` | Get learner dashboard data |
| `GET` | `/api/v1/reviews/due` | Get vocabulary due for review |
| `POST` | `/api/v1/reviews/:id` | Submit a review result |
| `GET` | `/api/v1/statistics` | Get personal learning statistics |
| `GET` | `/api/v1/hsk` | Get HSK content |
| `POST` | `/api/v1/courses/lessons/:id/complete` | Complete a lesson |

### Administration and media

Routes under `/api/v1/admin` require an access token and the `admin` role. They cover summary metrics, user management, course/module/lesson/content CRUD, HSK overview, notifications, and broadcasts.

Media upload uses `POST /api/v1/media/upload` with `multipart/form-data` and is restricted to administrators. Uploaded files are served under `/api/v1/media/files` according to `UPLOAD_DIR`.

## Database and seed data

The Prisma schema currently covers:

- Users, profiles, roles, permissions, refresh tokens, and audit logs.
- Courses, modules, lessons, sections, content blocks, and quizzes.
- Vocabulary, HSK vocabulary, grammar points, characters, and radicals.
- Listening, speaking, reading, and writing exercises and attempts.
- Course, lesson, and vocabulary progress; streaks; XP; and achievements.
- Favorites, bookmarks, notes, notifications, subscription, and payment foundations.

### Schema change workflow

1. Update `apps/api/prisma/schema.prisma`.
2. Run `npm run db:generate`.
3. Run `npm run db:migrate` locally.
4. Update `apps/api/prisma/seed.ts` if new development data is needed.
5. Run type checks, lint, tests, and build before opening a pull request.

For production, use reviewed and versioned migrations, backups, and a rollback plan. Do not treat `prisma db push` as a permanent production release process.

## Testing and quality checks

Run the complete local verification set before submitting changes:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The repository currently contains API service tests and frontend utility tests. New features should include coverage for business logic, validation, permissions, error handling, and important UI states.

## Production deployment

> **Important:** This is an active MVP. A successful build does not by itself mean the system is ready for real learner data or public traffic.

Minimum production checklist:

- Generate unique JWT secrets; do not use values from Compose or `.env.example`.
- Use managed PostgreSQL or an operated database with tested backups and restore procedures.
- Put the application behind HTTPS/TLS and a reverse proxy.
- Configure `FRONTEND_URL` to the exact production origin; do not use `*`.
- Keep PostgreSQL and internal API ports private.
- Replace the local upload directory with controlled object storage or hardened persistent storage.
- Validate upload MIME types, file size, file names, and access permissions; scan uploads where appropriate.
- Use versioned database migrations and review the generated SQL.
- Review refresh-token rotation, logout, rate limits, authorization, and account lockout behavior.
- Configure centralized logs, monitoring, alerting, error tracking, and backup verification.
- Add a privacy notice, terms of use, retention policy, and user-data deletion process appropriate to the deployment jurisdiction.
- Disable all demo accounts and remove development seed data from public environments.

A production Compose override is provided as a starting point:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

Review every domain, secret, port, volume, cookie, proxy, and database setting before using this command in a real environment.

## Security and privacy

- Never commit `.env` files, database dumps, tokens, private keys, uploads, or real personal data.
- Never expose server-only secrets through `VITE_*` variables.
- Do not use demo passwords on a public deployment.
- Enforce authentication and authorization on the server; UI route guards are not a security boundary.
- Review third-party content and media licenses before redistributing them.
- Dependencies and external assets may carry licenses separate from this repository.
- Report suspected vulnerabilities privately to the repository owner rather than posting exploit details in a public issue.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

At a minimum:

1. Create a focused branch from `main`.
2. Keep the change scoped and document behavior or setup changes.
3. Add or update tests for the affected behavior.
4. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
5. Do not include secrets, generated build output, database dumps, or real learner data.
6. Include migration, seed-data, API, accessibility, and deployment impact in the pull request description when applicable.

Suggested branch names and commit format:

```text
feat/srs-review
fix/auth-refresh
docs/deployment-guide
test/course-service

feat(web): add vocabulary review screen
fix(api): reject expired refresh tokens
docs: clarify Docker setup
```

## Roadmap

Planned areas include:

- Versioned database migration and safer release workflow.
- Broader integration and end-to-end coverage for auth, lessons, admin, and permissions.
- More complete SRS scheduling, scoring, and personalized recommendations.
- Speech/audio integrations behind explicit privacy and provider abstractions.
- Teacher content authoring, import/export, and content versioning.
- Observability, backup/restore automation, and production runbooks.
- Accessibility audits, internationalization, and improved mobile experience.

## License

Copyright 2026 Duc Quyen.

HanLearn is distributed under the [Apache License 2.0](LICENSE). You may use, reproduce, modify, distribute, and use the project commercially subject to the license terms.

When redistributing the project, retain the copyright, license, patent, trademark, and attribution notices required by Apache 2.0. Contributions submitted to this repository are licensed under Apache 2.0 unless a separate written agreement states otherwise.

