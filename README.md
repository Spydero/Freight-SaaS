# Ternline — Shipping Management SaaS (Portfolio)

![Ternline — quote to delivery, in one console](docs/screenshots/ternline-cover.jpg)

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
| `ops@ternline.demo` | `demo1234` | Ops |
| `client@ternline.demo` | `demo1234` | Client |
| `admin@ternline.demo` | `demo1234` | Admin |

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

- Marketing site (Ternline dark + gold)
- Register / login / roles
- Lead form → Ops inbox → create quote
- Client accept/reject quote → shipment
- Shipment timeline, comments, on-hold, documents (seeded)
- Public `/track/[token]` (Ops can regenerate link)
- Kanban board, analytics bars, search, notifications, CSV export
- Quote PDF print view

## Walkthrough

1. Open `/` — browse marketing, submit a lead  
2. Login as `ops@ternline.demo` — convert lead to quote  
3. Login as `client@ternline.demo` — accept quote  
4. As Ops — open shipment, add milestone, generate tracking link  
5. Open `/track/...` in a private window  

## Repo layout

```
apps/web          Next.js
apps/api          Express + Prisma
packages/shared   Zod schemas / shared types
```

## Spec

See [`TERNLINE-PORTFOLIO-SPEC.md`](./TERNLINE-PORTFOLIO-SPEC.md) for PRD, scope, and roadmap.

## How roles work (important)

| Role | Who | What they do |
|------|-----|----------------|
| **OPS / ADMIN** | Ternline logistics staff (your company) | See leads, create quotes, update shipments, kanban |
| **CLIENT** | Customer company user (e.g. Acme Trading) | Accept/reject quotes, view own shipments, comment |

**Account creation + approval (hybrid):**
- **Public `/register`** → **CLIENT only**, company starts **PENDING**
- Client can log in while pending, but **cannot accept/reject quotes** until Admin approves the company
- **Admin → Users** → Approve/Reject companies; also create clients/staff (admin-created companies are **APPROVED**)
- Nobody can self-register as Ops/Admin
- **Quotes:** Ops creates/sends; **approved** Client accepts/rejects

**Customer vs company:**  
- A **client user** (acceptor) is a person with role `CLIENT`.  
- A **company** is an `Organization` (e.g. Acme Trading Co.).  
Creating a quote (Ops) and accepting a quote (Client) are **different roles** — switch accounts to test both sides.

## How to create & test shipments

Shipments are **not** assigned by Ops. They are created only when an **approved client accepts a quotation**.

1. Open http://localhost:3000 — submit **Plan your next shipment** (or `/contact`).
2. Log in as **ops@ternline.demo** / `demo1234` → **Leads** → select lead → **Send quote** (pick Acme Trading).
3. Log out → log in as **client@ternline.demo** / `demo1234` → **Quotes** → **Accept** (company must be approved).
4. That creates the **Shipment**. Open it under **Shipments** or **Kanban**.
5. As Ops again: add milestones, generate public `/track/...` link.

**Already seeded:** log in as client or ops and open **Shipments** — sample bookings exist for browsing.
