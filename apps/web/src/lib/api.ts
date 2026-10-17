/**
 * Browser calls same-origin `/api/*` (Next proxy → Express).
 * That keeps the session cookie on the web origin so Client/Ops
 * updates are not lost to cross-port cookie / CORS quirks.
 */
const API_URL =
  typeof window === "undefined"
    ? (process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...(init.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "Request failed", res.status, data.code);
  }
  return data as T;
}

export { API_URL };
