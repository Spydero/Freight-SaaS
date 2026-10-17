"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLiveReload } from "@/lib/use-live-reload";
import { Badge, Card, PageHeader, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type Dash = {
  kpis: {
    openLeads: number;
    pendingQuotes: number;
    activeShipments: number;
    onHold: number;
    unread: number;
  };
  recentShipments: Array<{
    id: string;
    referenceCode: string;
    status: string;
    originLabel: string;
    destinationLabel: string;
    updatedAt: string;
    organization: { name: string };
  }>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dash | null>(null);

  const load = useCallback(async () => {
    const dash = await api<Dash>("/v1/dashboard");
    setData(dash);
  }, []);

  useLiveReload(load, [load]);

  const kpis = [
    { label: "Open leads", value: data?.kpis.openLeads ?? "—", hide: user?.role === "CLIENT" },
    { label: "Pending quotes", value: data?.kpis.pendingQuotes ?? "—" },
    { label: "Active shipments", value: data?.kpis.activeShipments ?? "—" },
    { label: "On hold", value: data?.kpis.onHold ?? "—" },
    { label: "Unread notices", value: data?.kpis.unread ?? "—" },
  ].filter((k) => !k.hide);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0] ?? "there"}`}
        description={`${user?.organizationName} · ${user?.role}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs uppercase tracking-wide text-white/45">{k.label}</div>
            <div className="mt-2 text-3xl font-semibold text-[var(--gold-soft)]">{k.value}</div>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent shipments</h2>
          <Link href="/app/shipments" className="text-sm text-[var(--gold)]">
            View all
          </Link>
        </div>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentShipments ?? []).map((s) => (
                <tr key={s.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <Link href={`/app/shipments/${s.id}`} className="text-[var(--gold-soft)] hover:underline">
                      {s.referenceCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {s.originLabel} → {s.destinationLabel}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(s.status)}>{s.status.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-white/50">{formatDate(s.updatedAt)}</td>
                </tr>
              ))}
              {!data?.recentShipments?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                    No shipments yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
