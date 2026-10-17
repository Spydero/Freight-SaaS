import { z } from "zod";

export const Role = z.enum(["ADMIN", "OPS", "CLIENT"]);
export type Role = z.infer<typeof Role>;

export const OrgApprovalStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type OrgApprovalStatus = z.infer<typeof OrgApprovalStatus>;

export const adminOrgApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(1000).optional(),
});

export const FreightMode = z.enum([
  "OCEAN",
  "RAIL",
  "ROAD",
  "AIR",
  "MULTIMODAL",
]);
export type FreightMode = z.infer<typeof FreightMode>;

export const ShipmentStatus = z.enum([
  "BOOKED",
  "IN_TRANSIT",
  "AT_CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "ON_HOLD",
  "CANCELLED",
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatus>;

export const QuoteStatus = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "REVISION_REQUESTED",
]);
export type QuoteStatus = z.infer<typeof QuoteStatus>;

export const LeadStatus = z.enum([
  "NEW",
  "IN_PROGRESS",
  "QUOTED",
  "CLOSED",
]);
export type LeadStatus = z.infer<typeof LeadStatus>;

export const DocumentType = z.enum([
  "BOL",
  "COMMERCIAL_INVOICE",
  "PACKING_LIST",
  "CUSTOMS",
  "OTHER",
]);
export type DocumentType = z.infer<typeof DocumentType>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Public self-serve signup — always creates CLIENT + new company. */
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(120),
  companyName: z.string().min(1).max(160),
});

/** Admin creates a client (acceptor) under an existing or new company. */
export const adminCreateClientSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6),
  organizationId: z.string().optional(),
  companyName: z.string().min(1).max(160).optional(),
}).refine((v) => Boolean(v.organizationId || v.companyName), {
  message: "Provide organizationId or companyName",
});

/** Admin creates Ternline staff (OPS or ADMIN). Never CLIENT via this path. */
export const adminCreateStaffSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["OPS", "ADMIN"]),
  organizationId: z.string().optional(),
});

export const adminCreateOrgSchema = z.object({
  name: z.string().min(1).max(160),
  billingEmail: z.string().email().optional(),
});

export const leadSchema = z.object({
  fullName: z.string().min(1).max(120),
  companyName: z.string().min(1).max(160),
  email: z.string().email(),
  destination: z.string().min(1).max(200),
  serviceCode: z.string().min(1).optional(),
  message: z.string().max(2000).optional(),
});

export const quoteLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createQuoteSchema = z.object({
  quoteRequestId: z.string().optional(),
  organizationId: z.string(),
  currency: z.string().default("USD"),
  validUntil: z.string().datetime().or(z.string().min(1)),
  notes: z.string().max(4000).optional(),
  lineItems: z.array(quoteLineSchema).min(1),
  mode: FreightMode.default("OCEAN"),
  originPortId: z.string().optional(),
  destinationPortId: z.string().optional(),
  originLabel: z.string().optional(),
  destinationLabel: z.string().optional(),
  weightKg: z.number().optional(),
  packageCount: z.number().int().optional(),
  containerCount: z.number().int().optional(),
  commodity: z.string().optional(),
});

export const shipmentEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  occurredAt: z.string().optional(),
  status: ShipmentStatus.optional(),
});

export const shipmentCommentSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const updateShipmentSchema = z.object({
  status: ShipmentStatus.optional(),
  holdReason: z.string().max(1000).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  etd: z.string().optional().nullable(),
  eta: z.string().optional().nullable(),
});

export const KANBAN_COLUMNS: ShipmentStatus[] = [
  "BOOKED",
  "IN_TRANSIT",
  "AT_CUSTOMS",
  "OUT_FOR_DELIVERY",
  "ON_HOLD",
  "DELIVERED",
];
