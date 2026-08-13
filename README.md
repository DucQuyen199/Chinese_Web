# HanLearn — Chinese Learning Platform

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-339933.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

HanLearn (repository name: **Chinese_Web**) is an open-source, self-hostable Chinese-learning platform for Vietnamese learners. It supports structured courses, four-skill practice, vocabulary review, HSK learning, Chinese characters, grammar, progress tracking, and administration.

The default interface is Vietnamese and the learning content uses Simplified Chinese.

> **Status:** v0.1.0 MVP. Suitable for local development, education, and experimentation. Review the production checklist before handling real learner data.

## Features

- Course catalog, modules, lessons, lesson player, quizzes, and progress.
- Listening, speaking, reading, and writing learning flows.
- Vocabulary, pinyin, spaced review, HSK, characters, radicals, and grammar.
- Streaks, XP, achievements, leaderboard, statistics, notes, bookmarks, and notifications.
- Authentication with JWT access tokens and refresh-token cookies.
- Admin tools for users, roles, courses, lessons, content blocks, HSK, notifications, and media.
- Responsive UI, dark mode, loading/error/empty states, and keyboard-friendly navigation.

For the complete product, API, data model, architecture, configuration, and acceptance criteria, see the [Project Specification](docs/PROJECT_SPECIFICATION.md).

## Technology

- React 18, TypeScript, Vite 6, Tailwind CSS 4.
- React Router, TanStack Query, Zustand, Axios, Zod, React Hook Form.
- Node.js 22, Express 4, Prisma 6, PostgreSQL 16.
- JWT, bcryptjs, Helmet, CORS, rate limiting, Pino, Multer.
- Docker Compose, Nginx, and Vitest.

## Quick start

Requirements: Node.js 22+, npm, and Docker Compose v2.

Clone and install:

```bash
git clone https://github.com/DucQuyen199/Chinese_Web.git
cd Chinese_Web
npm install
```

Create environment files.

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

Start PostgreSQL and seed development data:

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

| Service | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

For a full Docker stack:

```bash
docker compose up --build
```

The development migration command currently uses Prisma db push. Use reviewed, versioned migrations before production.

## Development commands

| Command | Purpose |
| --- | --- |
| npm run dev | Start web and API |
| npm run build | Build all workspaces |
| npm run typecheck | Type-check all workspaces |
| npm run lint | Run ESLint |
| npm test | Run tests |
| npm run db:generate | Generate Prisma Client |
| npm run db:migrate | Synchronize the development schema |
| npm run db:seed | Load demo/reference data |

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | student@hanlearn.local | DemoPass123! |
| Teacher | teacher@hanlearn.local | DemoPass123! |
| Administrator | admin@hanlearn.local | DemoPass123! |

Demo credentials are for local development only. Replace or disable them before public deployment.

## Documentation

- [Project Specification](docs/PROJECT_SPECIFICATION.md) — detailed product and technical requirements.
- [Contributing Guide](CONTRIBUTING.md) — setup, branch, commit, testing, and pull-request workflow.
- [Security Policy](SECURITY.md) — private vulnerability reporting and security expectations.
- [Code of Conduct](CODE_OF_CONDUCT.md) — community behavior and enforcement.
- [Apache License 2.0](LICENSE).

## Repository layout

```text
apps/web/       React/Vite frontend
apps/api/       Express API, Prisma schema, seed data
ops/            Nginx and tunnel examples
docs/           Detailed project specification
docker-compose.yml
```

## Community

Issues and pull requests are welcome. Please read the [Contributing Guide](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security vulnerabilities through the [Security Policy](SECURITY.md).

## License

Copyright 2026 Duc Quyen.

HanLearn is distributed under the [Apache License 2.0](LICENSE).
