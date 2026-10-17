"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";

type Org = { id: string; name: string; approvalStatus: string };

export default function NewQuotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role === "CLIENT") {
      router.replace("/app/quotes");
      return;
    }
    if (user && (user.role === "OPS" || user.role === "ADMIN")) {
      api<{ organizations: Org[] }>("/v1/catalog/organizations?clientsOnly=1&approvedOnly=1")
        .then((r) => setOrgs(r.organizations))
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load companies"));
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await api<{ quote: { id: string } }>("/v1/quotes", {
        method: "POST",
        body: JSON.stringify({
          organizationId: form.get("organizationId"),
          currency: "USD",
          validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
          notes: String(form.get("notes") || ""),
          mode: form.get("mode") || "OCEAN",
          originLabel: form.get("originLabel"),
          destinationLabel: form.get("destinationLabel"),
          weightKg: Number(form.get("weightKg") || 0) || undefined,
          packageCount: Number(form.get("packageCount") || 0) || undefined,
          containerCount: Number(form.get("containerCount") || 0) || undefined,
          commodity: form.get("commodity") || undefined,
          lineItems: [
            {
              description: String(form.get("lineDesc") || "Freight charges"),
              quantity: Number(form.get("quantity") || 1),
              unitPrice: Number(form.get("unitPrice") || 0),
            },
          ],
        }),
      });
      router.push(`/app/quotes/${res.quote.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quotation");
      setBusy(false);
    }
  }

  if (loading || user?.role === "CLIENT") {
    return <p className="text-white/50">Loading…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Create quotation"
        description="Send a priced offer to an approved client company. They must accept it before a shipment is created."
        actions={
          <Link href="/app/quotes">
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      {!orgs.length && !error ? (
        <Card className="mb-4 p-4 text-sm text-amber-100">
          No approved client companies found. Ask Admin to approve a registered company, or create a
          client under <Link className="text-[var(--gold)]" href="/app/admin/users">Users</Link>.
        </Card>
      ) : null}

      <Card className="max-w-2xl p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Client company (approved only)</Label>
            <Select name="organizationId" required defaultValue={orgs[0]?.id}>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Origin</Label>
              <Input name="originLabel" required placeholder="Singapore" defaultValue="Singapore" />
            </div>
            <div>
              <Label>Destination</Label>
              <Input name="destinationLabel" required placeholder="Rotterdam" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Mode</Label>
              <Select name="mode" defaultValue="OCEAN">
                <option value="OCEAN">Ocean</option>
                <option value="AIR">Air</option>
                <option value="RAIL">Rail</option>
                <option value="ROAD">Road</option>
                <option value="MULTIMODAL">Multimodal</option>
              </Select>
            </div>
            <div>
              <Label>Commodity</Label>
              <Input name="commodity" placeholder="Electronics" />
            </div>
          </div>
          <div>
            <Label>Line item description</Label>
            <Input name="lineDesc" defaultValue="Door-to-port freight package" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Quantity</Label>
              <Input name="quantity" type="number" step="0.01" defaultValue="1" required />
            </div>
            <div>
              <Label>Unit price (USD)</Label>
              <Input name="unitPrice" type="number" step="0.01" defaultValue="4200" required />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input name="weightKg" type="number" step="0.1" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" rows={3} placeholder="Inclusions, validity, Incoterms…" />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" disabled={busy || !orgs.length}>
            {busy ? "Sending…" : "Send quotation"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
