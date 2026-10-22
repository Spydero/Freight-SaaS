# Screenshots

Full-resolution captures from the local demo (`1440×900` at 2×).

| File | What it shows |
|------|----------------|
| `ternline-cover.jpg` | README cover with the live shipment console |
| `ternline-marketing-home.png` | Marketing landing page |
| `ternline-ops-dashboard.png` | Ops dashboard with KPIs and recent shipments |
| `ternline-quotes.png` | Quotes list |
| `ternline-shipments-list.png` | Full shipments table |
| `ternline-shipment-status-updated.png` | Ops shipment detail after saving **In transit** |
| `ternline-shipment-detail.png` | Full-page shipment detail (timeline, documents, tracking) |
| `ternline-kanban.png` | Ops kanban by status |
| `ternline-analytics.png` | Analytics view |
| `ternline-client-shipment-in-transit.png` | Same shipment on the client account |

## How shipments get created

1. **Ops sends a quotation** → approved **Client accepts** → shipment created  
2. **Seed data** on `pnpm db:seed` for demo browsing only  

Direct Ops “create shipment” was removed so client acceptance is required.
