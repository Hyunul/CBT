import { afterEach, expect, it } from "vitest";
import { clearOAuthReturn, currentReturnPath, loginHref, readOAuthReturn, rememberOAuthReturn, safeReturnPath } from "@/lib/login-return";

afterEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});

it.each([null, "https://evil.example", "//evil.example", "/\\evil.example", "/\n/evil.example", "\\evil.example"])("rejects unsafe return path %s", (path) => {
  expect(safeReturnPath(path)).toBe("/");
});

it("keeps the full internal destination through login and OAuth", () => {
  const path = "/attempts/7?review=true#question-2";
  window.history.replaceState(null, "", loginHref(path));
  expect(currentReturnPath()).toBe(path);
  rememberOAuthReturn();
  window.history.replaceState(null, "", "/login/oauth2/callback");
  expect(readOAuthReturn()).toBe(path);
  clearOAuthReturn();
  expect(readOAuthReturn()).toBe("/");
});

it("validates a tampered OAuth destination again on return", () => {
  sessionStorage.setItem("login-return-path", "//evil.example");
  expect(readOAuthReturn()).toBe("/");
});
