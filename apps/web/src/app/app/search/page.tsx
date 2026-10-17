"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, Input, PageHeader } from "@/components/ui";

type Result = {
  type: "shipment" | "quote" | "lead";
  id: string;
  label: string;
  subtitle: string;
};

export default function SearchPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [q, setQ] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const data = await api<{ results: Result[] }>(`/v1/search?q=${encodeURIComponent(q)}`);
    setResults(data.results);
  }

  function hrefFor(r: Result) {
    if (r.type === "shipment") return `/app/shipments/${r.id}`;
    if (r.type === "quote") return `/app/quotes/${r.id}`;
    return `/app/leads`;
  }

  return (
    <div>
      <PageHeader title="Search" description="Find shipments, quotes, and leads." />
      <form onSubmit={onSubmit} className="mb-6 flex max-w-xl gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ELI-2026… or Acme…" />
        <Button type="submit">Search</Button>
      </form>
      <div className="space-y-2">
        {results.map((r) => (
          <Link key={`${r.type}-${r.id}`} href={hrefFor(r)}>
            <Card className="p-4 hover:border-[var(--gold)]/30">
              <div className="text-xs uppercase tracking-wide text-white/40">{r.type}</div>
              <div className="font-medium text-[var(--gold-soft)]">{r.label}</div>
              <div className="text-sm text-white/55">{r.subtitle}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
