"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui";

type Analytics = {
  total: number;
  byStatus: Record<string, number>;
  byMode: Record<string, number>;
};

function Bars({ data }: { data: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between text-xs text-white/55">
            <span>{key.replaceAll("_", " ")}</span>
            <span>{value}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-[var(--gold)]"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {!Object.keys(data).length ? <p className="text-sm text-white/40">No data</p> : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api<Analytics>("/v1/shipments/analytics").then(setData).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Analytics" description="Simple shipment distribution charts for the demo." />
      <div className="mb-6">
        <Card className="inline-block p-5">
          <div className="text-xs uppercase tracking-wide text-white/45">Total shipments</div>
          <div className="mt-1 text-3xl font-semibold text-[var(--gold-soft)]">{data?.total ?? "—"}</div>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">By status</h2>
          <Bars data={data?.byStatus ?? {}} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">By mode</h2>
          <Bars data={data?.byMode ?? {}} />
        </Card>
      </div>
    </div>
  );
}
