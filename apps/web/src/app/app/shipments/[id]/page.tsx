"use client";

import { FormEvent, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLiveReload } from "@/lib/use-live-reload";
import { Badge, Button, Card, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";
import { ShipmentStatusTrack } from "@/components/shipment-status-track";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  "BOOKED",
  "IN_TRANSIT",
  "AT_CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<any>(null);
  const [trackUrl, setTrackUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [statusDirty, setStatusDirty] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const data = await api<{ shipment: any }>(`/v1/shipments/${id}`);
    setShipment(data.shipment);
    setSyncedAt(new Date());
    if (!statusBusy && !statusDirty) {
      setNextStatus(data.shipment.status);
    }
  }, [id, statusBusy, statusDirty]);

  useLiveReload(load, [load], 3000);

  async function updateStatus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!nextStatus || nextStatus === shipment?.status) {
      setError("Pick a different status to update.");
      return;
    }
    setStatusBusy(true);
    try {
      await api(`/v1/shipments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus !== "ON_HOLD" ? { holdReason: null } : {}),
        }),
      });
      setStatusDirty(false);
      setMsg(`Status updated → ${nextStatus.replaceAll("_", " ")}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusBusy(false);
    }
  }

  async function addEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMsg("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const statusRaw = String(form.get("status") || "");
    const title = String(form.get("title") || "").trim();
    if (!title && !statusRaw) {
      setError("Add a milestone title, or set a status.");
      return;
    }
    try {
      await api(`/v1/shipments/${id}/events`, {
        method: "POST",
        body: JSON.stringify({
          title: title || `Status → ${statusRaw.replaceAll("_", " ")}`,
          description: form.get("description") || undefined,
          location: form.get("location") || undefined,
          status: statusRaw || undefined,
        }),
      });
      formEl.reset();
      setMsg(statusRaw ? `Milestone added · status → ${statusRaw.replaceAll("_", " ")}` : "Milestone added");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add milestone");
    }
  }

  async function addComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await api(`/v1/shipments/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: form.get("body") }),
      });
      formEl.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    }
  }

  async function setHold(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMsg("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      await api(`/v1/shipments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "ON_HOLD",
          holdReason: form.get("holdReason"),
        }),
      });
      formEl.reset();
      setMsg("Shipment set to ON HOLD — client notified.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function clearHold() {
    setError("");
    setMsg("");
    try {
      await api(`/v1/shipments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "IN_TRANSIT",
          holdReason: null,
        }),
      });
      setMsg("Hold cleared · status → IN TRANSIT");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear hold");
    }
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
  const isClient = user?.role === "CLIENT";

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

      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      {msg ? <p className="mb-4 text-sm text-[var(--gold-soft)]">{msg}</p> : null}

      {isClient && syncedAt ? (
        <p className="mb-3 text-xs text-white/40">
          Last sync {syncedAt.toLocaleTimeString()} ·{" "}
          <button type="button" className="text-[var(--gold)] underline" onClick={() => void load()}>
            Refresh
          </button>
        </p>
      ) : null}

      <div className="mb-6">
        <ShipmentStatusTrack status={shipment.status} holdReason={shipment.holdReason} />
      </div>

      {isOps ? (
        <Card className="mb-6 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Update status</h2>
            {shipment.organization?.name ? (
              <Badge tone="gold">{shipment.organization.name}</Badge>
            ) : null}
          </div>
          <form onSubmit={updateStatus} className="mt-1 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="nextStatus">New status</Label>
              <Select
                id="nextStatus"
                value={nextStatus}
                onChange={(e) => {
                  setNextStatus(e.target.value);
                  setStatusDirty(true);
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={statusBusy || nextStatus === shipment.status}>
              {statusBusy ? "Saving…" : "Save status"}
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge>{shipment.mode}</Badge>
        {shipment.assignee ? <Badge tone="gold">Owner: {shipment.assignee.name}</Badge> : null}
        {isOps && shipment.organization?.name ? (
          <Badge>{shipment.organization.name}</Badge>
        ) : null}
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
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Timeline</h2>
            <p className="mt-1 text-xs text-white/45">Milestone history for this shipment.</p>
            <div className="mt-4 space-y-4">
              {shipment.events.map((event: any) => (
                <div key={event.id} className="border-l-2 border-[var(--gold)]/50 pl-4">
                  <div className="text-xs text-white/40">{formatDate(event.occurredAt)}</div>
                  <div className="font-medium">{event.title}</div>
                  {event.location ? <div className="text-sm text-white/55">{event.location}</div> : null}
                  {event.description ? <p className="text-sm text-white/65">{event.description}</p> : null}
                </div>
              ))}
              {!shipment.events.length ? (
                <p className="text-sm text-white/40">No milestones yet.</p>
              ) : null}
            </div>
            {isOps ? (
              <form onSubmit={addEvent} className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <Label>Add milestone (optional status change)</Label>
                <Input name="title" placeholder="Cleared customs in Rotterdam" />
                <Input name="location" placeholder="Location" />
                <Textarea name="description" rows={2} placeholder="Notes" />
                <Select name="status" defaultValue="">
                  <option value="">Keep current status ({shipment.status})</option>
                  {STATUS_OPTIONS.filter((s) => s !== "CANCELLED").map((s) => (
                    <option key={s} value={s}>
                      Also set status: {s.replaceAll("_", " ")}
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
              </Card>
              <Card className="p-5">
                <h2 className="font-semibold">Hold controls</h2>
                {shipment.status === "ON_HOLD" ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-amber-200">
                      Currently on hold{shipment.holdReason ? `: ${shipment.holdReason}` : ""}
                    </p>
                    <Button type="button" variant="secondary" onClick={() => void clearHold()}>
                      Resume (IN TRANSIT)
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={setHold} className="mt-3 space-y-2">
                    <Input name="holdReason" required placeholder="Customs exam / weather delay…" />
                    <Button type="submit" variant="danger">
                      Set ON HOLD
                    </Button>
                  </form>
                )}
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
