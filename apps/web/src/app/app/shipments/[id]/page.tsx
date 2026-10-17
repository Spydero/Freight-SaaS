"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Card, Input, Label, PageHeader, Select, Textarea, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<any>(null);
  const [trackUrl, setTrackUrl] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api<{ shipment: any }>(`/v1/shipments/${id}`);
    setShipment(data.shipment);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [id]);

  async function addEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await api(`/v1/shipments/${id}/events`, {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || undefined,
        location: form.get("location") || undefined,
        status: form.get("status") || undefined,
      }),
    });
    e.currentTarget.reset();
    await load();
  }

  async function addComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await api(`/v1/shipments/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: form.get("body") }),
    });
    e.currentTarget.reset();
    await load();
  }

  async function setHold(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await api(`/v1/shipments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "ON_HOLD",
        holdReason: form.get("holdReason"),
      }),
    });
    await load();
  }

  async function makeTrackingLink() {
    const res = await api<{ trackingToken: string; urlPath: string }>(`/v1/shipments/${id}/tracking-link`, {
      method: "POST",
    });
    setTrackUrl(res.urlPath);
    setMsg("Tracking link generated.");
  }

  if (!shipment) return <p className="text-white/50">Loading…</p>;

  const isOps = user?.role === "OPS" || user?.role === "ADMIN";

  return (
    <div>
      <PageHeader
        title={shipment.referenceCode}
        description={`${shipment.originLabel} → ${shipment.destinationLabel}`}
        actions={
          <Link href="/app/shipments">
            <Button variant="ghost">Back</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={statusTone(shipment.status)}>{shipment.status.replaceAll("_", " ")}</Badge>
        <Badge>{shipment.mode}</Badge>
        {shipment.assignee ? <Badge tone="gold">Owner: {shipment.assignee.name}</Badge> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="p-5">
            <h2 className="font-semibold">Cargo</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-white/45">Commodity</dt>
                <dd>{shipment.commodity ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-white/45">Weight</dt>
                <dd>{shipment.weightKg ? `${shipment.weightKg} kg` : "—"}</dd>
              </div>
              <div>
                <dt className="text-white/45">Packages</dt>
                <dd>{shipment.packageCount ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-white/45">Containers</dt>
                <dd>{shipment.containerCount ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-white/45">ETD</dt>
                <dd>{formatDate(shipment.etd)}</dd>
              </div>
              <div>
                <dt className="text-white/45">ETA</dt>
                <dd>{formatDate(shipment.eta)}</dd>
              </div>
            </dl>
            {shipment.holdReason ? (
              <p className="mt-4 text-sm text-amber-300">Hold reason: {shipment.holdReason}</p>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Timeline</h2>
            <div className="mt-4 space-y-4">
              {shipment.events.map((event: any) => (
                <div key={event.id} className="border-l-2 border-[var(--gold)]/50 pl-4">
                  <div className="text-xs text-white/40">{formatDate(event.occurredAt)}</div>
                  <div className="font-medium">{event.title}</div>
                  {event.location ? <div className="text-sm text-white/55">{event.location}</div> : null}
                  {event.description ? <p className="text-sm text-white/65">{event.description}</p> : null}
                </div>
              ))}
            </div>
            {isOps ? (
              <form onSubmit={addEvent} className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <Label>Add milestone</Label>
                <Input name="title" placeholder="Vessel arrived Rotterdam" required />
                <Input name="location" placeholder="Location" />
                <Textarea name="description" rows={2} placeholder="Notes" />
                <Select name="status" defaultValue="">
                  <option value="">Keep current status</option>
                  {["BOOKED", "IN_TRANSIT", "AT_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED", "ON_HOLD"].map((s) => (
                    <option key={s} value={s}>
                      Set status: {s}
                    </option>
                  ))}
                </Select>
                <Button type="submit">Add event</Button>
              </form>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold">Comments</h2>
            <div className="mt-3 space-y-3">
              {shipment.comments.map((c: any) => (
                <div key={c.id} className="rounded-lg bg-white/5 p-3 text-sm">
                  <div className="text-xs text-white/40">
                    {c.author.name} · {formatDate(c.createdAt)}
                  </div>
                  <p className="mt-1 text-white/80">{c.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addComment} className="mt-4 space-y-2">
              <Textarea name="body" rows={3} required placeholder="Write a note…" />
              <Button type="submit" variant="secondary">
                Post comment
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Documents</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {shipment.documents.map((d: any) => (
                <li key={d.id} className="flex justify-between gap-2 border-b border-white/10 py-2">
                  <span>{d.name}</span>
                  <Badge>{d.type}</Badge>
                </li>
              ))}
              {!shipment.documents.length ? <li className="text-white/40">No documents</li> : null}
            </ul>
          </Card>

          {isOps ? (
            <>
              <Card className="p-5">
                <h2 className="font-semibold">Public tracking</h2>
                <Button className="mt-3" variant="secondary" onClick={makeTrackingLink}>
                  Generate tracking link
                </Button>
                {trackUrl ? (
                  <p className="mt-3 text-sm">
                    <Link className="text-[var(--gold)]" href={trackUrl}>
                      {trackUrl}
                    </Link>
                  </p>
                ) : null}
                {msg ? <p className="mt-2 text-xs text-white/50">{msg}</p> : null}
              </Card>
              <Card className="p-5">
                <h2 className="font-semibold">Put on hold</h2>
                <form onSubmit={setHold} className="mt-3 space-y-2">
                  <Input name="holdReason" required placeholder="Customs exam / weather delay…" />
                  <Button type="submit" variant="danger">
                    Set ON HOLD
                  </Button>
                </form>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
