import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

const prisma = new PrismaClient();
const demoPassword = process.env.DEMO_PASSWORD ?? "demo1234";

function tracking() {
  const raw = randomBytes(24).toString("base64url");
  return {
    raw,
    hash: createHash("sha256").update(raw).digest("hex"),
    hint: raw.slice(0, 6),
  };
}

async function main() {
  console.log("Seeding Ternline demo data…");

  await prisma.shipmentComment.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.service.deleteMany();
  await prisma.port.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.testimonial.deleteMany();

  const services = await Promise.all(
    [
      { code: "OCEAN", name: "Ocean Freight", category: "MODE" as const, sortOrder: 1, description: "FCL & LCL ocean routes" },
      { code: "RAIL", name: "Rail Freight", category: "MODE" as const, sortOrder: 2, description: "Cross-border rail corridors" },
      { code: "ROAD", name: "Road Freight", category: "MODE" as const, sortOrder: 3, description: "FTL and regional trucking" },
      { code: "AIR", name: "Air Freight", category: "MODE" as const, sortOrder: 4, description: "Time-critical air cargo" },
      { code: "CUSTOMS", name: "Customs Clearance", category: "VAS" as const, sortOrder: 5, description: "Brokerage support" },
      { code: "WAREHOUSE", name: "Warehousing", category: "VAS" as const, sortOrder: 6, description: "Short-term storage" },
    ].map((s) => prisma.service.create({ data: s })),
  );

  const ports = await Promise.all(
    [
      { code: "SGSIN", name: "Singapore", country: "SG", type: "PORT" as const },
      { code: "NLRTM", name: "Rotterdam", country: "NL", type: "PORT" as const },
      { code: "USLAX", name: "Los Angeles", country: "US", type: "PORT" as const },
      { code: "CNSHA", name: "Shanghai", country: "CN", type: "PORT" as const },
      { code: "DEHAM", name: "Hamburg", country: "DE", type: "PORT" as const },
      { code: "INNSA", name: "Nhava Sheva", country: "IN", type: "PORT" as const },
      { code: "JFK", name: "New York JFK", country: "US", type: "AIRPORT" as const },
      { code: "FRA", name: "Frankfurt", country: "DE", type: "AIRPORT" as const },
    ].map((p) => prisma.port.create({ data: p })),
  );

  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const acme = await prisma.organization.create({
    data: {
      name: "Acme Trading Co.",
      slug: "acme",
      billingEmail: "client@ternline.demo",
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
    },
  });
  const globex = await prisma.organization.create({
    data: {
      name: "Globex Corp.",
      slug: "globex",
      billingEmail: "ops@ternline.demo",
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: { email: "admin@ternline.demo", name: "Ava Admin", passwordHash },
  });
  const ops = await prisma.user.create({
    data: { email: "ops@ternline.demo", name: "Omar Ops", passwordHash },
  });
  const client = await prisma.user.create({
    data: { email: "client@ternline.demo", name: "Casey Client", passwordHash },
  });

  await prisma.membership.createMany({
    data: [
      { userId: admin.id, organizationId: globex.id, role: "ADMIN" },
      { userId: ops.id, organizationId: globex.id, role: "OPS" },
      { userId: client.id, organizationId: acme.id, role: "CLIENT" },
    ],
  });

  const ocean = services.find((s) => s.code === "OCEAN")!;
  // Open lead Ops can convert from Leads → Send quote
  await prisma.quoteRequest.create({
    data: {
      contactName: "Casey Client",
      companyName: "Acme Trading Co.",
      email: "client@ternline.demo",
      destination: "Hamburg, DE",
      message: "Need another FCL for spare parts — please quote.",
      status: "NEW",
      serviceId: ocean.id,
      organizationId: acme.id,
    },
  });

  const lead = await prisma.quoteRequest.create({
    data: {
      contactName: "Casey Client",
      companyName: "Acme Trading Co.",
      email: "client@ternline.demo",
      destination: "Rotterdam, NL",
      message: "Need FCL for electronics components.",
      status: "QUOTED",
      serviceId: ocean.id,
      organizationId: acme.id,
    },
  });

  await prisma.quote.create({
    data: {
      organizationId: acme.id,
      quoteRequestId: lead.id,
      status: "SENT",
      currency: "USD",
      validUntil: new Date(Date.now() + 14 * 86400000),
      notes: "Includes origin handling. Customs optional add-on.",
      total: 4850,
      mode: "OCEAN",
      originLabel: "Singapore",
      destinationLabel: "Rotterdam",
      weightKg: 12500,
      packageCount: 48,
      containerCount: 1,
      commodity: "Electronics components",
      createdById: ops.id,
      lineItems: {
        create: [
          { description: "Ocean freight FCL 40'", quantity: 1, unitPrice: 3200 },
          { description: "Origin THC & documentation", quantity: 1, unitPrice: 650 },
          { description: "Destination handling", quantity: 1, unitPrice: 1000 },
        ],
      },
    },
  });

  const tokenA = tracking();
  const sin = ports.find((p) => p.code === "SGSIN")!;
  const rtm = ports.find((p) => p.code === "NLRTM")!;

  const shipment = await prisma.shipment.create({
    data: {
      organizationId: acme.id,
      referenceCode: "TRN-2026-00001",
      mode: "OCEAN",
      status: "IN_TRANSIT",
      originLabel: "Singapore",
      destinationLabel: "Rotterdam",
      originPortId: sin.id,
      destinationPortId: rtm.id,
      etd: new Date(Date.now() - 5 * 86400000),
      eta: new Date(Date.now() + 9 * 86400000),
      weightKg: 18000,
      packageCount: 60,
      containerCount: 2,
      commodity: "Industrial pumps",
      assigneeId: ops.id,
      trackingTokenHash: tokenA.hash,
      trackingTokenHint: tokenA.hint,
      events: {
        create: [
          {
            title: "Shipment booked",
            description: "Booking confirmed with carrier slot.",
            location: "Singapore",
            occurredAt: new Date(Date.now() - 8 * 86400000),
            createdById: ops.id,
          },
          {
            title: "Gate-in at terminal",
            location: "PSA Singapore",
            occurredAt: new Date(Date.now() - 6 * 86400000),
            createdById: ops.id,
          },
          {
            title: "Vessel departed",
            description: "MV Ternline STAR underway.",
            location: "Singapore",
            occurredAt: new Date(Date.now() - 5 * 86400000),
            createdById: ops.id,
          },
        ],
      },
      comments: {
        create: [
          {
            authorId: ops.id,
            body: "Transit looking on schedule. Will update after Suez waypoint.",
          },
          {
            authorId: client.id,
            body: "Thanks — please flag if ETA slips more than 48h.",
          },
        ],
      },
      documents: {
        create: [
          {
            name: "Draft Bill of Lading.pdf",
            type: "BOL",
            mimeType: "application/pdf",
            storageKey: "seed/bol-draft.pdf",
            sizeBytes: 120000,
          },
        ],
      },
    },
  });

  const tokenB = tracking();
  await prisma.shipment.create({
    data: {
      organizationId: acme.id,
      referenceCode: "TRN-2026-00002",
      mode: "AIR",
      status: "BOOKED",
      originLabel: "Frankfurt",
      destinationLabel: "New York JFK",
      weightKg: 420,
      packageCount: 6,
      commodity: "Medical devices",
      assigneeId: ops.id,
      trackingTokenHash: tokenB.hash,
      trackingTokenHint: tokenB.hint,
      events: {
        create: {
          title: "Air booking confirmed",
          occurredAt: new Date(),
          createdById: ops.id,
        },
      },
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { name: "Henry Mills", title: "Logistics Director", sortOrder: 1 },
      { name: "Sofia Chen", title: "Ocean Freight Lead", sortOrder: 2 },
      { name: "Marcus Reid", title: "Operations Manager", sortOrder: 3 },
      { name: "Priya Nair", title: "Client Success", sortOrder: 4 },
      { name: "Jonas Berg", title: "Customs Specialist", sortOrder: 5 },
      { name: "Amelia Ford", title: "Product & Platform", sortOrder: 6 },
      { name: "Diego Alvarez", title: "Rail Solutions", sortOrder: 7 },
      { name: "Nora Kim", title: "Air Cargo Lead", sortOrder: 8 },
    ],
  });

  await prisma.testimonial.create({
    data: {
      quote:
        "Ternline gave us reliable visibility across ocean lanes. Milestone updates replaced endless email threads.",
      authorName: "Robert Peterson",
      authorTitle: "CEO, Northwind Supply",
      sortOrder: 1,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: client.id,
        title: "Welcome to Ternline",
        body: "Explore your shipments and pending quotes. Demo password is shared in the README.",
      },
      {
        userId: ops.id,
        title: "Demo workspace ready",
        body: "Lead inbox, kanban, and sample in-transit shipment are seeded.",
      },
    ],
  });

  await prisma.activityLog.create({
    data: {
      organizationId: acme.id,
      actorId: ops.id,
      action: "seed.completed",
      entityType: "System",
      entityId: "seed",
      meta: { shipment: shipment.referenceCode },
    },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: %s):", demoPassword);
  console.log("  admin@ternline.demo / ops@ternline.demo / client@ternline.demo");
  console.log("Sample public tracking token:", tokenA.raw);
  console.log("  GET /v1/track/%s", tokenA.raw);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
