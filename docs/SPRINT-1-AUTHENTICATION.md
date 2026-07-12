# Sprint 1 — Authentication

## Included

- Prisma User, Organization, Membership, Session, and AuditLog models
- Platform roles: OWNER, ADMIN, MEMBER
- Register API
- Login API
- Logout API
- Current user API
- HTTP-only session cookie
- Register page
- Login page
- Protected dashboard
- Owner seed script

## Local test flow

1. Start Postgres: `docker compose up -d`
2. Copy environment: `copy .env.example .env`
3. Install dependencies: `pnpm install`
4. Generate Prisma: `pnpm db:generate`
5. Push schema: `pnpm db:push`
6. Seed owner: `pnpm db:seed`
7. Start apps: `pnpm dev`
8. Open `http://localhost:3000/login`

Default owner:

- Email: `owner@dropsync.local`
- Password: `ChangeMe123!`

Change these before deploying.
