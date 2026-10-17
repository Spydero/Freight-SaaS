"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Button, Input, Label, Select, Textarea } from "./ui";

export function LeadForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    try {
      await api("/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.get("fullName"),
          companyName: form.get("companyName"),
          email: form.get("email"),
          destination: form.get("destination"),
          serviceCode: form.get("serviceCode"),
          message: form.get("message") || undefined,
        }),
      });
      setStatus("done");
      setMessage("Request received. Our ops team will follow up — or log in to track progress.");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required placeholder="Jordan Lee" />
        </div>
        <div>
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" name="companyName" required placeholder="Acme Trading" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Input id="destination" name="destination" required placeholder="Rotterdam, NL" />
        </div>
      </div>
      <div>
        <Label htmlFor="serviceCode">Service</Label>
        <Select id="serviceCode" name="serviceCode" defaultValue="OCEAN">
          <option value="OCEAN">Ocean Freight</option>
          <option value="RAIL">Rail Freight</option>
          <option value="ROAD">Road Freight</option>
          <option value="AIR">Air Freight</option>
          <option value="CUSTOMS">Customs Clearance</option>
        </Select>
      </div>
      {!compact ? (
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" rows={4} placeholder="Cargo details, timing, Incoterms…" />
        </div>
      ) : null}
      <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "loading" ? "Sending…" : "Send request"}
      </Button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-300" : "text-[var(--gold-soft)]"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
