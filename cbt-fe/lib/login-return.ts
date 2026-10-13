const RETURN_KEY = "login-return-path";

export function safeReturnPath(path: string | null | undefined): string {
  // Browsers normalize backslashes and control characters when parsing URLs.
  if (!path?.startsWith("/") || path.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(path)) return "/";
  return path;
}

export function loginHref(path: string): string {
  return `/login?returnTo=${encodeURIComponent(safeReturnPath(path))}`;
}

export function currentReturnPath(): string {
  return safeReturnPath(new URLSearchParams(window.location.search).get("returnTo"));
}

export function rememberOAuthReturn(): void {
  try {
    sessionStorage.setItem(RETURN_KEY, currentReturnPath());
  } catch {
    // Login remains available when browser storage is disabled.
  }
}

export function readOAuthReturn(): string {
  try {
    return safeReturnPath(sessionStorage.getItem(RETURN_KEY));
  } catch {
    return "/";
  }
}

export function clearOAuthReturn(): void {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // No stored path to clear.
  }
}
