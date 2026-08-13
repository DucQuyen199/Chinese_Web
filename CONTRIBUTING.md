# Contributing to HanLearn

Thank you for helping improve HanLearn. Contributions are welcome in the form of bug fixes, tests, documentation, accessibility improvements, learning content, translations, and new features.

## Code of conduct

Please be respectful, constructive, and inclusive. Harassment, discrimination, personal attacks, and knowingly harmful content are not acceptable. Maintainers may remove content or decline contributions that do not meet these standards.

## Before you start

- Search existing issues and pull requests before opening a new one.
- For a large feature or architecture change, open an issue first so the scope can be discussed.
- Never include passwords, tokens, private keys, database dumps, real learner data, or other secrets in a contribution.
- Keep educational content accurate, appropriately sourced, and respectful of Vietnamese and Chinese language communities.

## Development setup

Requirements:

- Node.js 22 or newer
- npm
- Docker Compose v2 and PostgreSQL 16 for the full local stack

```bash
git clone https://github.com/DucQuyen199/Chinese_Web.git
cd Chinese_Web
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

On Windows PowerShell, use `Copy-Item` instead of `cp` when copying the environment files.

## Branches and commits

Create a focused branch from `main`, for example:

```text
feat/srs-review
fix/auth-refresh
docs/deployment-guide
test/course-service
```

Use clear, imperative commit messages. Conventional Commits are recommended:

```text
feat(web): add vocabulary review screen
fix(api): reject expired refresh tokens
docs: clarify Docker setup
test(api): cover lesson completion
```

Do not mix unrelated refactors, formatting-only changes, or generated files into a feature commit.

## Pull request requirements

Before opening a pull request:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

A pull request should:

- Explain the problem and the chosen solution.
- Describe API, schema, migration, seed-data, or environment changes.
- Include or update tests for business logic and important error/permission paths.
- Include screenshots or a short recording for meaningful UI changes.
- Update `README.md` or other documentation when behavior or setup changes.
- Confirm that no secrets or personal data are included.

Keep pull requests reviewable. If a change is large, split it into logically independent pull requests where possible.

## Implementation guidance

### Frontend

- Keep pages and components focused and reusable.
- Handle loading, empty, success, and error states.
- Preserve responsive behavior, keyboard access, visible focus, and semantic labels.
- Keep server state in the API/query layer and avoid duplicating it in local state.
- Never expose server-side secrets through `VITE_*` variables.

### Backend

- Follow the route → middleware → controller → service → Prisma flow.
- Validate untrusted input at the API boundary with Zod.
- Enforce authentication and authorization on the server, not only in the UI.
- Use safe, parameterized Prisma queries and avoid leaking sensitive fields in responses.
- Add tests for authentication, authorization, validation, transactions, and failure cases.

### Database

- Review schema changes for indexes, constraints, cascade behavior, and data privacy.
- Update seed data only when it is deterministic and safe for local development.
- Do not use `prisma db push` as a production release strategy; use reviewed, versioned migrations for production.
- Document any backfill, rollback, or data-loss risk in the pull request.

## Issues and security reports

Use GitHub Issues for reproducible bugs, feature requests, and documentation improvements. Include the version/commit, environment, reproduction steps, expected behavior, actual behavior, and relevant logs with secrets removed.

Do not publish an exploitable security vulnerability in a public issue. Contact the repository owner privately through GitHub with the affected area, impact, reproduction details, and a suggested mitigation.

## Review and merge

Maintainers review correctness, security, accessibility, maintainability, test coverage, and documentation. A contribution may be requested for changes or declined if it introduces unacceptable risk or does not fit the project direction.

By submitting a contribution, you agree that it is your original work or that you have permission to submit it, and that it is provided under the repository's [Apache License 2.0](LICENSE).

