"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";
import { useRouter } from "next/navigation";

type Org = {
  id: string;
  name: string;
  slug: string;
  _count?: { members: number; shipments: number; quotes: number };
};

type ListedUser = {
  membershipId: string;
  role: string;
  user: { id: string; email: string; name: string };
  organization: { id: string; name: string };
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [o, u] = await Promise.all([
      api<{ organizations: Org[] }>("/v1/admin/organizations"),
      api<{ users: ListedUser[] }>("/v1/admin/users"),
    ]);
    setOrgs(o.organizations);
    setUsers(u.users);
  }

  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN") {
      router.replace("/app");
      return;
    }
    if (user?.role === "ADMIN") {
      load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    }
  }, [user, loading, router]);

  async function createOrg(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/v1/admin/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          billingEmail: form.get("billingEmail") || undefined,
        }),
      });
      e.currentTarget.reset();
      setMsg("Company created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function createClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setError("");
    const form = new FormData(e.currentTarget);
    const mode = String(form.get("mode"));
    try {
      await api("/v1/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          ...(mode === "existing"
            ? { organizationId: form.get("organizationId") }
            : { companyName: form.get("companyName") }),
        }),
      });
      e.currentTarget.reset();
      setMsg("Client (acceptor) account created. Share the password with them.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function createStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/v1/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
        }),
      });
      e.currentTarget.reset();
      setMsg("Staff account created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  if (loading || user?.role !== "ADMIN") {
    return <p className="text-white/50">Loading admin…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Users & companies"
        description="Create client (acceptor) accounts for customers, or Ternline staff. Public register stays client-only."
      />

      {msg ? <p className="mb-4 text-sm text-[var(--gold-soft)]">{msg}</p> : null}
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">New company</h2>
          <p className="mt-1 text-xs text-white/45">Create a customer org before adding users (optional).</p>
          <form onSubmit={createOrg} className="mt-4 space-y-3">
            <div>
              <Label>Company name</Label>
              <Input name="name" required placeholder="Northwind Supply" />
            </div>
            <div>
              <Label>Billing email</Label>
              <Input name="billingEmail" type="email" placeholder="ap@northwind.com" />
            </div>
            <Button type="submit">Create company</Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Create client (acceptor)</h2>
          <p className="mt-1 text-xs text-white/45">
            On behalf of a customer — they can accept quotes and view shipments.
          </p>
          <form onSubmit={createClient} className="mt-4 space-y-3">
            <div>
              <Label>Attach to</Label>
              <Select name="mode" defaultValue="existing">
                <option value="existing">Existing company</option>
                <option value="new">New company + user</option>
              </Select>
            </div>
            <div>
              <Label>Existing company</Label>
              <Select name="organizationId" defaultValue={orgs.find((o) => o.name.includes("Acme"))?.id ?? orgs[0]?.id}>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>New company name (if “New company”)</Label>
              <Input name="companyName" placeholder="Contoso Logistics" />
            </div>
            <div>
              <Label>Full name</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <Label>Temporary password</Label>
              <Input name="password" type="text" minLength={6} required placeholder="Share with client" />
            </div>
            <Button type="submit">Create client account</Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Create staff</h2>
          <p className="mt-1 text-xs text-white/45">Ops or Admin only — not available via public register.</p>
          <form onSubmit={createStaff} className="mt-4 space-y-3">
            <div>
              <Label>Full name</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <Label>Role</Label>
              <Select name="role" defaultValue="OPS">
                <option value="OPS">OPS</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
            </div>
            <div>
              <Label>Temporary password</Label>
              <Input name="password" type="text" minLength={6} required />
            </div>
            <Button type="submit">Create staff account</Button>
          </form>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3 font-semibold">Companies</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/45">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Members</th>
                <th className="px-4 py-2">Shipments</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-t border-white/10">
                  <td className="px-4 py-2">{o.name}</td>
                  <td className="px-4 py-2">{o._count?.members ?? "—"}</td>
                  <td className="px-4 py-2">{o._count?.shipments ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3 font-semibold">All users</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/45">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Company</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.membershipId} className="border-t border-white/10">
                  <td className="px-4 py-2">
                    <div>{u.user.name}</div>
                    <div className="text-xs text-white/40">{u.user.email}</div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={u.role === "CLIENT" ? "gold" : "neutral"}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-2 text-white/70">{u.organization.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
