import { createHash, randomBytes } from "node:crypto";

export function createTrackingToken() {
  const raw = randomBytes(24).toString("base64url");
  return {
    raw,
    hash: hashToken(raw),
    hint: raw.slice(0, 6),
  };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function makeReferenceCode(seq: number) {
  const year = new Date().getFullYear();
  return `TRN-${year}-${String(seq).padStart(5, "0")}`;
}
