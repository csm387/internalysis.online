const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiError = { error: string };

export async function apiFetch<T>(
  path: string,
  opts?: {
    method?: string;
    body?: unknown;
    csrfToken?: string | null;
  },
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts?.method ?? (opts?.body ? "POST" : "GET"),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.csrfToken ? { "x-csrf": opts.csrfToken } : {}),
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (json as ApiError | null)?.error ?? `HTTP ${res.status}`;
    throw new Error(err);
  }
  return json as T;
}

