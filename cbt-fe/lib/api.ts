export const API_BASE = process.env.API_BASE || "http://localhost:8080";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  const contentLength = res.headers.get("Content-Length");
  const contentType = res.headers.get("Content-Type");

  if (
    (contentLength && parseInt(contentLength) === 0) ||
    (contentType && !contentType.includes("application/json"))
  ) {
    return [] as T;
  }

  try {
    return res.json();
  } catch (e) {
    console.warn(
      "API response was not valid JSON, returning empty array/object.",
      e
    );
    return [] as T;
  }
}
