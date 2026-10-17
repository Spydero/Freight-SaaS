import { SiteHeader } from "@/components/site-header";
import { LeadForm } from "@/components/lead-form";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--ink)] text-white">
      <div className="relative">
        <SiteHeader />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-32 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold">Contact</h1>
            <p className="mt-4 text-white/65">
              Submit a shipment interest form. Ops demo users will see it in the lead inbox.
            </p>
            <p className="mt-6 text-sm text-white/45">hello@elios.demo · +1 (555) 014-2000</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
            <LeadForm />
          </div>
        </div>
      </div>
    </main>
  );
}
