# Screenshots

Captured during local UI testing (Ops account).

| File | What it shows |
|------|----------------|
| `ternline-ops-dashboard.png` | Ops dashboard with shipments |
| `ternline-shipments-list-create.png` | Shipments list (older shot; create button removed) |
| `ternline-create-shipment-form.png` | Older direct-create form (removed from product) |
| `ternline-shipment-detail-created.png` | Shipment detail view |

## How shipments get created

1. **Ops sends a quotation** → approved **Client accepts** → shipment created  
2. **Seed data** on `pnpm db:seed` for demo browsing only  

Direct Ops “create shipment” was removed so client acceptance is required.
