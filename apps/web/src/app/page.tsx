import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { LeadForm } from "@/components/lead-form";
import { Button } from "@/components/ui";

const principles = [
  {
    n: "01",
    title: "Reliability",
    body: "Punctual handoffs and clear ownership from booking to delivery.",
  },
  {
    n: "02",
    title: "Transparency",
    body: "Milestone visibility for every shipment — no black-box transit.",
  },
  {
    n: "03",
    title: "Efficiency",
    body: "Smarter mode selection across ocean, rail, road, and air.",
  },
  {
    n: "04",
    title: "Partnership",
    body: "Long-term ops relationships, not one-off freight transactions.",
  },
];

const services = [
  "Ocean Freight",
  "Rail Freight",
  "Road Freight",
  "Air Freight",
  "Customs Clearance",
  "Warehousing",
  "Logistics Consulting",
  "Project Logistics",
];

const team = [
  ["Henry Mills", "Logistics Director"],
  ["Sofia Chen", "Ocean Freight Lead"],
  ["Marcus Reid", "Operations Manager"],
  ["Priya Nair", "Client Success"],
  ["Jonas Berg", "Customs Specialist"],
  ["Amelia Ford", "Product & Platform"],
  ["Diego Alvarez", "Rail Solutions"],
  ["Nora Kim", "Air Cargo Lead"],
];

export default function HomePage() {
  return (
    <main className="bg-[var(--ink)] text-white">
      <SiteHeader />

      <section className="relative min-h-[92vh] overflow-hidden">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,12,14,0.35) 0%, rgba(11,12,14,0.72) 55%, rgba(11,12,14,0.95) 100%), url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-28">
          <p className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-[0.2em] text-white sm:text-7xl">
            ELIOS
          </p>
          <h1 className="mt-6 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">
            Delivering confidence through modern logistics.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            Quote, book, and track freight with a portfolio-grade shipping console built for clarity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#plan">
              <Button>Get a quote</Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary">Contact</Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <div className="rounded-lg border border-white/15 bg-black/35 px-5 py-4 backdrop-blur">
              <div className="text-2xl font-semibold text-[var(--gold)]">35+</div>
              <div className="text-xs uppercase tracking-wide text-white/55">Global corridors</div>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/35 px-5 py-4 backdrop-blur">
              <div className="text-2xl font-semibold text-[var(--gold)]">24/7</div>
              <div className="text-xs uppercase tracking-wide text-white/55">Ops visibility</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-xl leading-relaxed text-white/80 sm:text-2xl">
          Founded with a commitment to reliability and efficiency, ELIOS helps businesses navigate
          complex supply chains through integrated logistics workflows.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/about">
            <Button>About us</Button>
          </Link>
          <Link href="/#principles">
            <Button variant="secondary">Values</Button>
          </Link>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[var(--panel)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div
            className="min-h-80 rounded-2xl bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              A logistics partner for a connected world.
            </h2>
            <p className="mt-4 text-white/65">
              From first quote to final milestone, ELIOS keeps shippers and ops on the same page —
              with kanban boards, document trails, and public tracking links.
            </p>
          </div>
        </div>
      </section>

      <section id="principles" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div
            className="min-h-96 rounded-2xl bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, transparent, rgba(11,12,14,0.75)), url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div>
            <h2 className="text-3xl font-semibold">The principles that move every shipment.</h2>
            <div className="mt-8 space-y-6">
              {principles.map((p) => (
                <div key={p.n} className="border-t border-white/10 pt-5">
                  <div className="flex gap-4">
                    <span className="text-[var(--gold)]">{p.n}</span>
                    <div>
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="mt-1 text-sm text-white/60">{p.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[var(--panel)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold">A higher standard for modern logistics.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--gold)]/30 bg-black/30 p-8">
              <h3 className="text-xl font-semibold text-[var(--gold-soft)]">Precision in every shipment</h3>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                {services.slice(0, 4).map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-8">
              <h3 className="text-xl font-semibold">Support & relationship management</h3>
              <ul className="mt-5 space-y-2 text-sm text-white/70">
                {services.slice(4).map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-semibold">The people behind every successful journey.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map(([name, title]) => (
            <div key={name} className="rounded-xl border border-white/10 bg-[var(--panel-2)] p-4">
              <div className="mb-4 aspect-[4/5] rounded-lg bg-gradient-to-br from-white/10 to-white/5" />
              <div className="font-medium">{name}</div>
              <div className="text-sm text-white/50">{title}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[var(--panel)] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Trusted by businesses that keep moving.</h2>
          <blockquote className="mt-8 text-lg text-white/75 sm:text-xl">
            “ELIOS gave us reliable visibility across ocean lanes. Milestone updates replaced endless
            email threads.”
          </blockquote>
          <p className="mt-4 text-sm text-[var(--gold)]">Robert Peterson — CEO, Northwind Supply</p>
        </div>
      </section>

      <section id="plan" className="relative overflow-hidden py-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(11,12,14,0.92), rgba(11,12,14,0.55)), url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-semibold sm:text-4xl">Plan your next shipment.</h2>
            <p className="mt-4 max-w-md text-white/70">
              Tell us where cargo needs to go. Demo ops users can convert this lead into a live quote
              inside the app.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/55 p-6 backdrop-blur">
            <LeadForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-[0.2em] text-white/90 sm:text-7xl">
            ELIOS
          </div>
          <div className="mt-8 grid gap-8 text-sm text-white/55 sm:grid-cols-3">
            <div>
              <div className="mb-2 font-medium text-white/80">Product</div>
              <Link href="/app" className="block hover:text-white">
                Console
              </Link>
              <Link href="/login" className="block hover:text-white">
                Log in
              </Link>
            </div>
            <div>
              <div className="mb-2 font-medium text-white/80">Company</div>
              <Link href="/about" className="block hover:text-white">
                About
              </Link>
              <Link href="/contact" className="block hover:text-white">
                Contact
              </Link>
            </div>
            <div>
              <div className="mb-2 font-medium text-white/80">Demo</div>
              <p>ops@elios.demo / client@elios.demo</p>
              <p>password: demo1234</p>
            </div>
          </div>
          <p className="mt-10 text-xs text-white/35">
            Portfolio project — not a commercial carrier. © {new Date().getFullYear()} ELIOS Demo.
          </p>
        </div>
      </footer>
    </main>
  );
}
