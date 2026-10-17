# Screenshots

Captured during local UI testing (Ops account).

| File | What it shows |
|------|----------------|
| `ternline-ops-dashboard.png` | Ops dashboard with seeded + created shipments |
| `ternline-shipments-list-create.png` | Shipments list (Create shipment action) |
| `ternline-create-shipment-form.png` | Direct create-shipment form for Ops/Admin |
| `ternline-shipment-detail-created.png` | Detail after creating TRN-2026-00004 (Busan → LA) |

## How shipments get created

1. **Ops/Admin → Shipments → Create shipment** (direct booking)
2. **Client accepts a quote** → shipment auto-created
3. **Seed data** on `pnpm db:seed` for demo browsing
