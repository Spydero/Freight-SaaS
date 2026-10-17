import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--ink)] text-white">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold">Our story</h1>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            ELIOS is a portfolio shipping management SaaS. It demonstrates a complete quote-to-delivery
            workflow with roles, kanban ops boards, document trails, analytics, and public tracking —
            without depending on live carrier APIs.
          </p>
          <p className="mt-4 text-white/60">
            The product surface mirrors what a modern freight forwarder console needs: lead intake,
            quoting, shipment milestones, and client visibility.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <Button>Talk to us</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
