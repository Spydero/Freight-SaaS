"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui";

export function SiteHeader() {
  const { user } = useAuth();

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[0.18em]">
          ELIOS
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <Link href="/#services" className="hover:text-white">
            Services
          </Link>
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/#team" className="hover:text-white">
            Team
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/app">
              <Button>Open app</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
