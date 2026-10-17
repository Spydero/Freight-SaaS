# ELIOS — Shipping Management SaaS (Portfolio)

Polished logistics console + marketing site. Quote → shipment → milestone tracking, with ops kanban, analytics, and public track links.

> Portfolio demo — not a real carrier. Carrier GPS/email/payments are mocked.

## Stack

- **Web:** Next.js 15, TypeScript, Tailwind CSS
- **API:** Express + TypeScript
- **DB:** PostgreSQL + Prisma
- **Auth:** Cookie sessions (JWT via `jose` + bcrypt)

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `ops@elios.demo` | `demo1234` | Ops |
| `client@elios.demo` | `demo1234` | Client |
| `admin@elios.demo` | `demo1234` | Admin |

## Quick start

```bash
# 1) Postgres running locally (or Docker Compose)
#    DATABASE_URL=postgresql://elios:elios@localhost:5432/elios

cp .env.example .env
pnpm install
pnpm --filter @elios/shared build
pnpm db:migrate   # or: pnpm --filter @elios/api exec prisma migrate dev
pnpm db:seed

# 2) Run API + Web
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
```

Docker (optional):

```bash
docker compose up -d
```

## What works today

- Marketing site (ELIOS dark + gold)
- Register / login / roles
- Lead form → Ops inbox → create quote
- Client accept/reject quote → shipment
- Shipment timeline, comments, on-hold, documents (seeded)
- Public `/track/[token]` (Ops can regenerate link)
- Kanban board, analytics bars, search, notifications, CSV export
- Quote PDF print view

## Walkthrough

1. Open `/` — browse marketing, submit a lead  
2. Login as `ops@elios.demo` — convert lead to quote  
3. Login as `client@elios.demo` — accept quote  
4. As Ops — open shipment, add milestone, generate tracking link  
5. Open `/track/...` in a private window  

## Repo layout

```
apps/web          Next.js
apps/api          Express + Prisma
packages/shared   Zod schemas / shared types
```

## Spec

See [`ELIOS-PORTFOLIO-SPEC.md`](./ELIOS-PORTFOLIO-SPEC.md) for PRD, scope, and roadmap.
