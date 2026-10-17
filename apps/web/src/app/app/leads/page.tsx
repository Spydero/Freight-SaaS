"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Card, Input, Label, PageHeader, Select, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type Lead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  destination: string;
  status: string;
  message?: string;
  createdAt: string;
  service?: { name: string; code: string };
};

type Org = { id: string; name: string };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const [l, o] = await Promise.all([
      api<{ leads: Lead[] }>("/v1/leads"),
      api<{ organizations: Org[] }>("/v1/catalog/organizations"),
    ]);
    setLeads(l.leads);
    setOrgs(o.organizations);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function createQuote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    try {
      await api("/v1/quotes", {
        method: "POST",
        body: JSON.stringify({
          quoteRequestId: selected.id,
          organizationId: form.get("organizationId"),
          currency: "USD",
          validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
          notes: String(form.get("notes") || ""),
          mode: form.get("mode") || "OCEAN",
          originLabel: form.get("originLabel"),
          destinationLabel: form.get("destinationLabel") || selected.destination,
          weightKg: Number(form.get("weightKg") || 0) || undefined,
          commodity: form.get("commodity") || undefined,
          lineItems: [
            {
              description: String(form.get("lineDesc") || "Freight charges"),
              quantity: 1,
              unitPrice: Number(form.get("unitPrice") || 0),
            },
          ],
        }),
      });
      setMsg("Quote sent to client.");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <PageHeader title="Leads" description="Inbound shipment requests from the marketing form." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer border-t border-white/10 hover:bg-white/5"
                  onClick={() => {
                    setSelected(lead);
                    setMsg("");
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{lead.companyName}</div>
                    <div className="text-xs text-white/45">{lead.contactName}</div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{lead.destination}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-white/45">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          {!selected ? (
            <p className="text-sm text-white/45">Select a lead to convert into a quote.</p>
          ) : (
            <div>
              <h2 className="text-lg font-semibold">{selected.companyName}</h2>
              <p className="mt-1 text-sm text-white/55">
                {selected.email} · {selected.service?.name ?? "General"}
              </p>
              {selected.message ? <p className="mt-3 text-sm text-white/70">{selected.message}</p> : null}
              <form onSubmit={createQuote} className="mt-5 space-y-3">
                <div>
                  <Label>Client organization</Label>
                  <Select name="organizationId" required defaultValue={orgs[0]?.id}>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Origin</Label>
                    <Input name="originLabel" defaultValue="Singapore" required />
                  </div>
                  <div>
                    <Label>Destination</Label>
                    <Input name="destinationLabel" defaultValue={selected.destination} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Mode</Label>
                    <Select name="mode" defaultValue="OCEAN">
                      <option value="OCEAN">Ocean</option>
                      <option value="AIR">Air</option>
                      <option value="RAIL">Rail</option>
                      <option value="ROAD">Road</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Unit price (USD)</Label>
                    <Input name="unitPrice" type="number" step="0.01" defaultValue="4200" required />
                  </div>
                </div>
                <div>
                  <Label>Line description</Label>
                  <Input name="lineDesc" defaultValue="Door-to-port freight package" />
                </div>
                <div>
                  <Label>Commodity</Label>
                  <Input name="commodity" placeholder="Electronics" />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input name="notes" placeholder="Validity and inclusions" />
                </div>
                <Button type="submit">Send quote</Button>
                {msg ? <p className="text-sm text-[var(--gold-soft)]">{msg}</p> : null}
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
