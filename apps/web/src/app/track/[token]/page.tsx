"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Badge, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type TrackPayload = {
  shipment: {
    referenceCode: string;
    status: string;
    mode: string;
    originLabel: string;
    destinationLabel: string;
    etd?: string;
    eta?: string;
    holdReason?: string;
    organizationName: string;
    events: Array<{
      id: string;
      title: string;
      description?: string;
      location?: string;
      occurredAt: string;
    }>;
  };
};

export default function TrackPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<TrackPayload["shipment"] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<TrackPayload>(`/v1/track/${params.token}`)
      .then((res) => setData(res.shipment))
      .catch((err) => setError(err instanceof Error ? err.message : "Not found"));
  }, [params.token]);

  return (
    <main className="min-h-screen bg-[var(--ink)] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.18em]">
          ELIOS
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Shipment tracking</h1>
        {error ? <p className="mt-6 text-red-300">{error}</p> : null}
        {!data && !error ? <p className="mt-6 text-white/50">Loading…</p> : null}
        {data ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xl font-semibold">{data.referenceCode}</div>
                <Badge tone={statusTone(data.status)}>{data.status.replaceAll("_", " ")}</Badge>
              </div>
              <p className="mt-2 text-sm text-white/55">{data.organizationName}</p>
              <p className="mt-4 text-white/80">
                {data.originLabel} → {data.destinationLabel}
              </p>
              <p className="mt-2 text-sm text-white/50">
                {data.mode} · ETD {formatDate(data.etd)} · ETA {formatDate(data.eta)}
              </p>
              {data.holdReason ? (
                <p className="mt-3 text-sm text-amber-300">On hold: {data.holdReason}</p>
              ) : null}
            </div>
            <div className="space-y-4">
              {data.events.map((event) => (
                <div key={event.id} className="border-l-2 border-[var(--gold)]/60 pl-4">
                  <div className="text-sm text-white/45">{formatDate(event.occurredAt)}</div>
                  <div className="font-medium">{event.title}</div>
                  {event.location ? <div className="text-sm text-white/55">{event.location}</div> : null}
                  {event.description ? (
                    <p className="mt-1 text-sm text-white/65">{event.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
