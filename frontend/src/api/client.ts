const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function getClerkToken(): Promise<string | null> {
  try {
    // Clerk exposes itself on window.Clerk after load
    const clerk = (window as any).Clerk;
    if (clerk?.session) return clerk.session.getToken();
    // Fallback: wait for Clerk to load
    if (clerk) return null;
    return null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: { raw?: boolean },
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const token = await getClerkToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (opts?.raw) {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return (await res.text()) as unknown as T;
    }
    if (!res.ok) {
      if (res.status === 429) window.dispatchEvent(new CustomEvent("torque:toast", { detail: { message: "Rate limit exceeded", type: "warning" } }));
      if (res.status === 500) window.dispatchEvent(new CustomEvent("torque:toast", { detail: { message: "Internal server error", type: "error" } }));
      if (res.status === 401) return [] as unknown as T;
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || data?.detail || `Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      window.dispatchEvent(new CustomEvent("torque:toast", { detail: { message: "Network error", type: "error" } }));
      return [] as unknown as T;
    }
    throw err;
  }
}
