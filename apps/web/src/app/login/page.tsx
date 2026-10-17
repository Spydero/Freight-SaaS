"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Input, Label } from "@/components/ui";

const demos = [
  {
    email: "ops@ternline.demo",
    label: "Ops (send quotations)",
    hint: "Ternline staff — leads, send quotes, milestones, kanban",
  },
  {
    email: "client@ternline.demo",
    label: "Client (accept quotes)",
    hint: "Approved customer — accept/reject quotes to create shipments",
  },
  {
    email: "admin@ternline.demo",
    label: "Admin",
    hint: "Platform admin",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("ops@ternline.demo");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ink)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--panel)] p-8">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[0.18em]">
          Ternline
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-white/55">
          Ops creates quotes. Client accepts them. Use different accounts to test both sides.
        </p>

        <div className="mt-4 space-y-2">
          {demos.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword("demo1234");
              }}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left hover:border-[var(--gold)]/40"
            >
              <div className="text-sm font-medium text-[var(--gold-soft)]">{d.label}</div>
              <div className="text-xs text-white/45">{d.hint}</div>
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-white/50">
          No account?{" "}
          <Link href="/register" className="text-[var(--gold)]">
            Register as a client company
          </Link>
        </p>
      </div>
    </main>
  );
}
