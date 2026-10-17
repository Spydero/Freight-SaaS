"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { KANBAN_COLUMNS } from "@elios/shared";
import { api } from "@/lib/api";
import { useLiveReload } from "@/lib/use-live-reload";
import { Badge, Button, Card, PageHeader, statusTone } from "@/components/ui";

type Shipment = {
  id: string;
  referenceCode: string;
  status: string;
  mode: string;
  originLabel: string;
  destinationLabel: string;
  organization: { name: string };
  assignee?: { name: string } | null;
};

export default function KanbanPage() {
  const [columns, setColumns] = useState<Record<string, Shipment[]>>({});

  const load = useCallback(async () => {
    const res = await api<{ columns: Record<string, Shipment[]> }>("/v1/shipments/kanban");
    setColumns(res.columns);
  }, []);

  useLiveReload(load, [load]);

  return (
    <div>
      <PageHeader
        title="Ops kanban"
        description="Shipments by status. Drag-and-drop can come later — click a card for details."
        actions={
          <Button variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const items = columns[status] ?? [];
          return (
            <div key={status} className="w-72 shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <Badge tone={statusTone(status)}>{status.replaceAll("_", " ")}</Badge>
                <span className="text-xs text-white/40">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((s) => (
                  <Link key={s.id} href={`/app/shipments/${s.id}`}>
                    <Card className="p-3 transition hover:border-[var(--gold)]/40">
                      <div className="font-medium text-[var(--gold-soft)]">{s.referenceCode}</div>
                      <div className="mt-1 text-xs text-white/55">{s.organization.name}</div>
                      <div className="mt-2 text-sm text-white/75">
                        {s.originLabel} → {s.destinationLabel}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                        <span>{s.mode}</span>
                        <span>{s.assignee?.name ?? "Unassigned"}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
                {!items.length ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/35">
                    Empty
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
