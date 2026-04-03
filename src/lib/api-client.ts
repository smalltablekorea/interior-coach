/**
 * Fetch wrapper that handles 401 responses by redirecting to login.
 * Use this instead of raw fetch() in dashboard pages.
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // Session expired — redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login?expired=1";
    }
    throw new Error("Session expired");
  }
  return res;
}
