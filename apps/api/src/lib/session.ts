import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@elios/shared";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.SESSION_SECRET);
export const SESSION_COOKIE = "elios_session";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName: string;
};

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
