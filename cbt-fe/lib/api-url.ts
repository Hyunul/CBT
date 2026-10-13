export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
export function apiUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, "");
  return base.endsWith("/api") && path.startsWith("/api/")
    ? base + path.slice(4)
    : base + path;
}
