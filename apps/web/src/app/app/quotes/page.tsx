"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Card, PageHeader, statusTone } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/utils";

type Quote = {
  id: string;
  status: string;
  currency: string;
  total: string | number;
  validUntil: string;
  originLabel?: string;
  destinationLabel?: string;
  organization: { name: string };
  shipment?: { id: string; referenceCode: string } | null;
};

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const data = await api<{ quotes: Quote[] }>("/v1/quotes");
    setQuotes(data.quotes);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function accept(id: string) {
    setBusy(id);
    try {
      const res = await api<{ shipment: { id: string; referenceCode: string; trackingToken?: string } }>(
        `/v1/quotes/${id}/accept`,
        { method: "POST" },
      );
      setMessage(
        `Accepted — ${res.shipment.referenceCode}` +
          (res.shipment.trackingToken ? ` · track /track/${res.shipment.trackingToken}` : ""),
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    try {
      await api(`/v1/quotes/${id}/reject`, { method: "POST" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Quotes"
        description={
          user?.role === "CLIENT"
            ? "Review offers from Ternline. Accepting a quote is what creates your shipment."
            : "Prepare and send quotations. A shipment is created only after the approved client accepts."
        }
        actions={
          user?.role === "OPS" || user?.role === "ADMIN" ? (
            <Link
              href="/app/quotes/new"
              className="inline-flex items-center justify-center rounded-md bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:brightness-110"
            >
              + Create quotation
            </Link>
          ) : null
        }
      />
      {message ? <p className="mb-4 text-sm text-[var(--gold-soft)]">{message}</p> : null}
      <div className="space-y-3">
        {quotes.map((q) => (
          <Card key={q.id} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Quote {q.id.slice(-6).toUpperCase()}</span>
                  <Badge tone={statusTone(q.status)}>{q.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-white/55">
                  {q.organization.name} · {q.originLabel ?? "Origin"} → {q.destinationLabel ?? "Destination"}
                </p>
                <p className="mt-2 text-lg text-[var(--gold-soft)]">
                  {formatMoney(Number(q.total), q.currency)}
                  <span className="ml-2 text-sm text-white/40">valid {formatDate(q.validUntil)}</span>
                </p>
                {q.shipment ? (
                  <Link href={`/app/shipments/${q.shipment.id}`} className="mt-2 inline-block text-sm text-[var(--gold)]">
                    Shipment {q.shipment.referenceCode}
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/app/quotes/${q.id}`}>
                  <Button variant="secondary">Details / PDF</Button>
                </Link>
                {user?.role === "CLIENT" && q.status === "SENT" ? (
                  user.canAcceptQuotes ? (
                    <>
                      <Button disabled={busy === q.id} onClick={() => accept(q.id)}>
                        Accept
                      </Button>
                      <Button variant="ghost" disabled={busy === q.id} onClick={() => reject(q.id)}>
                        Reject
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-amber-200/90">
                      Pending company approval — accept/reject locked
                    </p>
                  )
                ) : null}
              </div>
            </div>
          </Card>
        ))}
        {!quotes.length ? <p className="text-sm text-white/45">No quotes yet.</p> : null}
      </div>
    </div>
  );
}
