# ELIOS — Portfolio Shipping Management SaaS

**Status:** Planning document (no production business intent)  
**Purpose:** A polished, deployable portfolio project that looks and feels like a real logistics SaaS  
**Stack:** Next.js + TypeScript + Tailwind + shadcn/ui · Express + TypeScript · PostgreSQL · Prisma · BetterAuth (or simple session auth) · Vitest + Playwright  

---

## 1. What this project is (and is not)

### It is
- A **portfolio showcase**: marketing site + authenticated demo app
- Something you can **push to GitHub** and **deploy** (free/cheap tiers)
- A believable B2B logistics product UI with a working quote → shipment → tracking loop
- Seeded with demo data so reviewers can click around without signing up for real services

### It is not
- A real logistics company or production TMS
- Dependent on Maersk/FedEx/customs/EDI/GPS APIs
- Dependent on paid email, Stripe, or Twilio to “work”
- Multi-region enterprise tenancy, SOC2, or real customer onboarding

**Rule of thumb:** If a feature needs a third-party account you cannot demo for free in a resume link, **fake it with seed data, in-app “sent” logs, or local mocks**.

---

## 2. Product thesis (portfolio framing)

Visitors land on a dark, gold-accented logistics brand site (inspired by the ELIOS reference). They can:

1. Browse services, principles, team, and testimonials  
2. Submit a “Plan your next shipment” form  
3. Log in as a **demo client** or **demo ops** user  
4. See quotes turn into shipments with a status timeline  
5. Open a public tracking link  

That full path is the **demo script** you put in the README. Hiring managers should complete it in under 10 minutes.

---

## 3. Scope — full-fledged portfolio product

Auth alone is not enough. The app should feel like a real SaaS: marketing, CRM-lite leads, quoting, shipments, docs, analytics, settings, and polish. External carrier/email/payment APIs stay mocked.

### 3.1 Feature matrix (locked before build)

#### Must have (ship these)

| # | Feature | Notes |
|---|---------|--------|
| M1 | Marketing site | Home, Services, About, Contact — ELIOS dark + gold |
| M2 | Register + Login + Logout | Real auth; invite/seed clients also OK |
| M3 | Roles: Admin / Ops / Client | Different nav + permissions |
| M4 | Lead capture + Ops inbox | Public form → QuoteRequest lifecycle |
| M5 | Quotes with line items | Draft → Sent → Accept / Reject / Request revision |
| M6 | Shipments CRUD + filters | Mode, status, search, reference codes |
| M7 | Cargo details | Weight, packages, container count, commodity (form fields) |
| M8 | Milestone timeline | Ops adds events; drives status |
| M9 | Public tracking page | Opaque token; no login |
| M10 | Documents on shipment | Upload or seeded PDF; types: BOL, invoice, packing list |
| M11 | In-app notifications | Stands in for email (“Quote ready”, “Milestone added”) |
| M12 | Role-aware dashboard | KPIs: open leads, pending quotes, active / delayed shipments |
| M13 | Settings | Profile, change password, org name |
| M14 | Seeded demo world | Users, orgs, sample leads/quotes/shipments, never empty |
| M15 | README + deploy story | Demo accounts, walkthrough, architecture |

#### Should have (makes it feel full-fledged — include these)

| # | Feature | Notes |
|---|---------|--------|
| S1 | Quote PDF download | Generate PDF from quote (no Stripe) |
| S2 | Shipment notes / comments | Thread on shipment for Ops ↔ Client |
| S3 | Assign Ops owner | Shipment has `assigneeId` |
| S4 | Exception / On hold | Status + reason; shows on timeline |
| S5 | Simple analytics page | Charts: shipments by status, by mode (Recharts or similar) |
| S6 | Global search | Search shipments / quotes / leads by ref or company |
| S7 | Activity / audit log | “Ops updated milestone”, “Client accepted quote” |
| S8 | Ports / locations directory | Seeded ports; pickers on quote/shipment forms |
| S9 | CSV export | Export shipments table |
| S10 | Admin catalog CRUD | Services, team members, testimonials |
| S11 | Forgot password (demo) | Resets via in-app flow or “check notifications” mock |
| S12 | Empty + loading + error states | Polished UX everywhere |

#### Nice to have (only if time after Must + Should)

| # | Feature | Notes |
|---|---------|--------|
| N1 | Ops kanban board | Columns by shipment status |
| N2 | Cmd-K command palette | Jump to shipment / actions |
| N3 | Dark/light toggle in app | Marketing stays dark-branded |
| N4 | Multi-org switcher | 2 seeded client orgs |
| N5 | Invoice PDF (post-delivery) | Static “amount due” PDF — still no payments |
| N6 | Email preview panel | Show HTML that “would have been sent” |
| N7 | i18n stub | EN only, but strings in one file |

### 3.2 Explicitly out of scope (still)

- Live carrier / GPS / EDI / customs filing APIs  
- Real Resend/Postmark/Twilio as a hard dependency  
- Stripe / card payments / subscription billing  
- WMS, warehouse inventory, IoT  
- Native mobile apps  
- Schema-per-tenant / enterprise SSO / SAML  

**Clarification:** “No Stripe” does **not** mean no invoices. PDF quotes/invoices as downloadable documents are in scope (S1 / N5).

---

## 4. Personas & demo accounts

Seed these in `prisma/seed.ts` and print them in the README:

| Email | Password | Role | What they show |
|-------|----------|------|----------------|
| `ops@elios.demo` | `demo1234` | OPS | Lead inbox, create quotes, update milestones |
| `client@elios.demo` | `demo1234` | CLIENT | Accept quotes, view shipments, download docs |
| `admin@elios.demo` | `demo1234` | ADMIN | Optional: services/team content |

One demo organization: **Acme Trading Co.**  
One pre-built shipment already in transit so the dashboard is never empty on first login.

---

## 5. Core user flows

### Flow A — Marketing → lead (public)
1. Open landing page  
2. Fill “Plan your next shipment” (name, company, email, destination, service)  
3. See confirmation  
4. Ops sees new row in Leads  

### Flow B — Quote → shipment (authenticated)
1. Login as Ops → open lead → create quote (line items, total, valid until)  
2. Login as Client → Quotes → Accept  
3. System creates Shipment `BOOKED` with tracking token  
4. Ops adds events (“Departed Singapore”, “Arrived Rotterdam”)  
5. Client sees timeline; open `/track/...` in incognito  

### Flow C — Empty-state free browse
Seed data means Flow B can be skipped by reviewers: just log in and explore existing shipments.

---

## 6. UX / IA blueprint

### Visual direction (from reference)
- Dark charcoal / black base, white type, **gold/yellow** primary CTAs  
- Full-bleed industrial photography on marketing (ships, containers, rail)  
- Brand wordmark as a hero-level signal  
- First viewport: brand + one headline + one support line + CTA group + image — no card soup, no stats wall overload  
- App shell: same palette, denser tables for Ops, calmer detail pages for Client  

### Public routes
```
/                 Marketing home
/services         Service catalog
/about            Story + principles
/contact          Lead form
/track/[token]    Public shipment timeline
/login
```

### App routes
```
/app                      Role-aware dashboard
/app/leads                Ops only
/app/quotes               List + detail
/app/shipments            List + detail + timeline
/app/shipments/[id]       Detail
/app/settings             Profile / org (minimal)
```

### shadcn/ui you will actually use
Button, Input, Select, Textarea, Form, Table, Badge, Tabs, Dialog, Sheet, DropdownMenu, Avatar, Separator, Toast, Skeleton.

Marketing sections are mostly custom Tailwind — do not force everything into Cards.

---

## 7. What to mock vs what to make real

| Concern | Portfolio approach |
|---------|-------------------|
| Carrier / GPS tracking | **Fake:** Ops types milestones; timestamps stored in DB |
| Email | **Fake:** `Notification` table + “Notifications” panel showing “email would send…”; optionally log to console in dev |
| File storage | **Simple:** store under `uploads/` locally; on Vercel/serverless use **seeded document metadata only** or Cloudflare R2 free tier if you want real uploads |
| Payments | **Skip entirely** |
| Maps | **Skip** or static map image; no Google Maps billing |
| Auth | **Real** BetterAuth (or lightweight cookie sessions) against Postgres |
| Multi-tenancy | **Light:** one or two orgs in seed; `organizationId` on rows for realism, not a product pitch |

This keeps the deploy free and the demo reliable.

---

## 8. Database design (Prisma / PostgreSQL)

### Models (keep lean)

```
Organization
  id, name, slug

User (+ BetterAuth tables as required)
Member
  userId, organizationId, role  // ADMIN | OPS | CLIENT

Service
  code, name, category (MODE | VAS), description, active

QuoteRequest          // lead from marketing form
  id, companyName, contactName, email, destination,
  serviceId, message?, status (NEW | IN_PROGRESS | QUOTED | CLOSED),
  organizationId?, createdAt

Quote
  id, quoteRequestId?, organizationId, status,
  currency, validUntil, notes, total,
  createdById, createdAt

QuoteLineItem
  id, quoteId, description, quantity, unitPrice

Shipment
  id, organizationId, quoteId?, referenceCode,
  mode, status, origin (json/text), destination (json/text),
  etd, eta, trackingTokenHash, createdAt

ShipmentEvent         // milestones — append only
  id, shipmentId, title, description?, location?,
  occurredAt, createdById

Document
  id, shipmentId, name, type, mimeType, storageKey | url, uploadedAt

ShipmentComment
  id, shipmentId, authorId, body, createdAt

Notification          // mock inbox (replaces email)
  id, userId, title, body, readAt?, createdAt

Port / Location       // seeded directory for pickers
  id, code, name, country, type (PORT|AIRPORT|CITY)

ActivityLog           // audit / activity feed
  id, organizationId, actorId, action, entityType, entityId, meta, createdAt

TeamMember / Testimonial   // admin-managed marketing content
```

Shipment also includes: `assigneeId`, cargo fields (`weightKg`, `packageCount`, `containerCount`, `commodity`), `holdReason`.

### Status enums

**ShipmentStatus:** `BOOKED` → `IN_TRANSIT` → `AT_CUSTOMS` → `OUT_FOR_DELIVERY` → `DELIVERED` (+ `ON_HOLD`, `CANCELLED`)  

**QuoteStatus:** `DRAFT` | `SENT` | `ACCEPTED` | `REJECTED` | `EXPIRED`

### Indexes
- `(organizationId, status)` on Quote, Shipment, QuoteRequest  
- unique `(organizationId, referenceCode)` e.g. `ELI-2026-00421`  
- unique hash for tracking tokens (store **hash**, put raw token only in URL once)

---

## 9. Architecture

### Repo layout (monorepo)
```
elios/
  apps/
    web/          # Next.js App Router
    api/          # Express + TypeScript
  packages/
    shared/       # zod schemas + types shared by web & api
  docker-compose.yml   # postgres for local
  README.md
```

Avoid NestJS. Keep Express as:

```
apps/api/src/
  app.ts
  server.ts
  config/env.ts
  lib/prisma.ts
  middleware/auth.ts
  middleware/rbac.ts
  modules/leads|quotes|shipments|auth/
  seed helpers
```

### How the browser talks to the API
**Recommended for portfolio:** Next.js rewrites `/api/*` → Express so cookies stay same-site and CORS stays simple.

### Auth recommendation
- Prefer **BetterAuth on Express** with Prisma adapter  
- If the Express integration burns more than ~1 day, use a minimal **iron-session / cookie session** + bcrypt — portfolio reviewers care more about the product demo than auth vendor choice  

### Deploy options (pick one path and document it)

| Path | Web | API + DB | Notes |
|------|-----|----------|-------|
| **A — Simplest story** | Vercel | Railway/Render + Neon Postgres | Classic split; free tiers enough |
| **B — One box** | Fly.io / Railway runs API; Next also on Vercel | Neon | Same as A |
| **C — GitHub only** | No live deploy | Docker Compose instructions | Still valid portfolio if README + screenshots are excellent |

**Suggested default:** Path A — live URL in README impresses more than “clone locally only.”

Use Neon’s free Postgres so you are not managing a server. Disable real file uploads in production if storage is painful; seed document links instead.

---

## 10. API surface (MVP)

| Method | Path | Auth |
|--------|------|------|
| POST | `/v1/leads` | Public (rate limit lightly) |
| * | `/v1/auth/*` | BetterAuth |
| GET | `/v1/me` | Authed |
| GET | `/v1/quote-requests` | Ops |
| POST | `/v1/quotes` | Ops |
| POST | `/v1/quotes/:id/accept` | Client |
| GET/POST | `/v1/shipments` | Org-scoped |
| POST | `/v1/shipments/:id/events` | Ops |
| GET | `/v1/track/:token` | Public |
| GET | `/v1/notifications` | Authed |

Validate every body with **Zod**. Return consistent `{ error, code }` shapes.

---

## 11. Testing (appropriate, not theatrical)

| Layer | Tool | Cover |
|-------|------|--------|
| Unit | Vitest | Status transitions, RBAC helpers, token hashing |
| API | Vitest + supertest + Prisma against test DB | Lead → quote → accept → event |
| E2E | Playwright | Login as client, open shipment, public track page |
| Skip | Heavy visual regression, load tests | Not worth it for portfolio |

Aim for **a few high-value tests**, not coverage theater.

---

## 12. Implementation roadmap (portfolio pace)

Assume nights/weekends, ~1 person.

| Phase | Time | Deliverable |
|-------|------|-------------|
| **0 Foundations** | 3–5 days | Monorepo, Prisma schema, seed users, auth login, Docker Postgres, CI lint/test |
| **1 Marketing** | 4–6 days | ELIOS-style landing + lead form wired to API |
| **2 Quotes** | 3–5 days | Ops create/send, Client accept → shipment |
| **3 Tracking** | 3–5 days | Timeline UI, public track page, notifications mock |
| **4 Polish + deploy** | 3–5 days | Seed richness, README, screenshots, Neon + Vercel + Railway, demo accounts |

**Total:** roughly **3–5 weeks** part-time — enough for a strong portfolio piece without boiling the ocean.

### Definition of done
- [ ] Live URL works with demo logins  
- [ ] README has demo script + architecture + stack  
- [ ] GitHub repo is clean (no secrets; `.env.example` present)  
- [ ] Happy path works without any paid third-party account  
- [ ] UI looks intentional (dark + gold), not generic AI-purple SaaS  

---

## 13. README outline (write this when you ship)

1. One-line pitch + screenshot  
2. Live demo URL + demo accounts  
3. 10-minute walkthrough  
4. Stack  
5. Architecture diagram (simple boxes)  
6. Local setup (`docker compose up`, `pnpm install`, `pnpm db:seed`, `pnpm dev`)  
7. What is mocked vs real  
8. License (MIT is fine)  

---

## 14. Decisions locked for portfolio

| Decision | Choice | Why |
|----------|--------|-----|
| Business vs portfolio | Portfolio only | No real customers, no compliance theater |
| NestJS | No | Unnecessary complexity |
| Tenancy | Soft `organizationId` + 1–2 seeded orgs | Looks real, stays simple |
| Tracking | Manual milestones | No carrier APIs |
| Email | Notification log (mock) | Deploy without Resend/Postmark |
| Payments | None | Out of scope |
| CMS | Seed / static for team & testimonials | Faster polish |
| Auth | BetterAuth preferred; simple sessions OK | Spike-cap 1 day |
| Deploy | Vercel + API host + Neon | Shareable link for recruiters |

---

## 15. Demo script (put on README)

1. Open live site — scroll marketing (hero → services → team → form).  
2. Submit a shipment request as “Globex Corp”.  
3. Login `ops@elios.demo` / `demo1234` — convert lead to quote.  
4. Login `client@elios.demo` / `demo1234` — accept quote.  
5. As Ops, add a milestone.  
6. Open the public tracking link in a private window.  

---

## 16. Suggested next steps

When you want to leave planning mode:

1. **Create a new GitHub repo** `elios` (do not mix into the healthcare monorepo unless you intend to).  
2. Scaffold Phase 0 (pnpm monorepo + Prisma + seed).  
3. Build marketing homepage against the ELIOS visual reference.  
4. Wire the three demo flows.  
5. Deploy and freeze the README.

Until then, this document is the source of truth for scope. If a new idea needs a paid API or a week of integration, **cut it** or **mock it**.
