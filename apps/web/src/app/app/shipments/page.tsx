"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Card, Input, PageHeader, Select, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";

async function downloadCsv() {
  const res = await fetch(`${API_URL}/v1/shipments/export.csv`, {
    credentials: "include",
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shipments.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type Shipment = {
  id: string;
  referenceCode: string;
  status: string;
  mode: string;
  originLabel: string;
  destinationLabel: string;
  eta?: string;
  organization: { name: string };
  assignee?: { name: string } | null;
};

export default function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const data = await api<{ shipments: Shipment[] }>(`/v1/shipments?${params}`);
    setShipments(data.shipments);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [status]);

  return (
    <div>
      <PageHeader
        title="Shipments"
        description={
          user?.role === "CLIENT"
            ? "Your bookings appear here after you accept a quotation."
            : "Shipments are created only when an approved client accepts a quotation — not assigned directly by Ops."
        }
        actions={
          <Button variant="secondary" onClick={() => void downloadCsv()}>
            Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search reference, route, commodity…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={() => load()}>
          Search
        </Button>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {["BOOKED", "IN_TRANSIT", "AT_CUSTOMS", "OUT_FOR_DELIVERY", "ON_HOLD", "DELIVERED", "CANCELLED"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </Select>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Org</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">ETA</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <Link href={`/app/shipments/${s.id}`} className="text-[var(--gold-soft)] hover:underline">
                    {s.referenceCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white/65">{s.organization.name}</td>
                <td className="px-4 py-3 text-white/70">
                  {s.originLabel} → {s.destinationLabel}
                </td>
                <td className="px-4 py-3">{s.mode}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(s.status)}>{s.status.replaceAll("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 text-white/50">{formatDate(s.eta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
