"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";

type Org = { id: string; name: string };

export default function NewShipmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role === "CLIENT") {
      router.replace("/app/shipments");
      return;
    }
    if (user && user.role !== "CLIENT") {
      api<{ organizations: Org[] }>("/v1/catalog/organizations")
        .then((r) => setOrgs(r.organizations))
        .catch(console.error);
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await api<{ shipment: { id: string; referenceCode: string; trackingToken?: string } }>(
        "/v1/shipments",
        {
          method: "POST",
          body: JSON.stringify({
            organizationId: form.get("organizationId"),
            mode: form.get("mode"),
            originLabel: form.get("originLabel"),
            destinationLabel: form.get("destinationLabel"),
            commodity: form.get("commodity") || undefined,
            weightKg: Number(form.get("weightKg") || 0) || undefined,
            packageCount: Number(form.get("packageCount") || 0) || undefined,
            containerCount: Number(form.get("containerCount") || 0) || undefined,
            notes: form.get("notes") || undefined,
          }),
        },
      );
      router.push(`/app/shipments/${res.shipment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shipment");
      setBusy(false);
    }
  }

  if (loading || user?.role === "CLIENT") {
    return <p className="text-white/50">Loading…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Create shipment"
        description="Book a shipment directly for a client company (no quote required)."
        actions={
          <Link href="/app/shipments">
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />
      <Card className="max-w-2xl p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Client company</Label>
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
              <Input name="originLabel" required placeholder="Singapore" />
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
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Weight (kg)</Label>
              <Input name="weightKg" type="number" step="0.1" />
            </div>
            <div>
              <Label>Packages</Label>
              <Input name="packageCount" type="number" />
            </div>
            <div>
              <Label>Containers</Label>
              <Input name="containerCount" type="number" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" rows={3} placeholder="Booking notes for the timeline…" />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create shipment"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
