# DropSync AI

AI-powered multi-channel commerce platform.

## Quick Start

```bash
pnpm install
copy .env.example .env
pnpm dev
```

Open:

- Web: http://localhost:3000
- API: http://localhost:4000/health

## Optional Database

```bash
docker compose up -d
pnpm db:generate
pnpm db:push
```

## Apps

- `apps/web` - Next.js web app
- `apps/api` - NestJS API

## Packages

- `packages/types` - shared TypeScript types
- `packages/utils` - shared utilities
