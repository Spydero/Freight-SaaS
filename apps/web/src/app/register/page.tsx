"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Input, Label } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await register({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        companyName: String(form.get("companyName")),
      });
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ink)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--panel)] p-8">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[0.18em]">
          ELIOS
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-white/55">Creates a client organization for your company.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="companyName">Company</Label>
            <Input id="companyName" name="companyName" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--gold)]">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
