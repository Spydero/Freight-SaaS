# Screenshots

Captured from the local demo (`ops@ternline.demo` and `client@ternline.demo`).

| File | What it shows |
|------|----------------|
| `ternline-cover.jpg` | README cover for the repo |
| `ternline-ops-dashboard.png` | Ops dashboard with open leads and recent shipments |
| `ternline-shipments-list.png` | Shipments list after client acceptance |
| `ternline-shipment-status-updated.png` | Ops status control after saving **In transit** |
| `ternline-client-shipment-in-transit.png` | Same shipment on the client account, status in sync |
| `ternline-kanban.png` | Ops kanban with shipments in the In transit column |
| `shipment-on-hold.png` | Shipment placed on hold |
| `ternline-shipment-detail-created.png` | Earlier shipment detail view |
| `ternline-shipments-list-create.png` | Older shipments list (create button removed) |
| `ternline-create-shipment-form.png` | Older direct-create form (removed from product) |

## How shipments get created

1. **Ops sends a quotation** → approved **Client accepts** → shipment created
2. **Seed data** on `pnpm db:seed` for demo browsing only

Direct Ops “create shipment” was removed so client acceptance is required.
