import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => {
  localStorage.clear();
  useAuth.getState().clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});
describe("API transport", () => {
  it("accepts empty responses and preserves caller headers", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    expect(
      await api("/api/attempts/1/answers", {
        method: "POST",
        headers: { "X-Custom": "yes" },
      }),
    ).toBeNull();
    expect(new Headers(fetcher.mock.calls[0][1].headers).get("X-Custom")).toBe(
      "yes",
    );
  });
  it("persists and sends the guest capability", async () => {
    const response = json(27);
    response.headers.set("X-Attempt-Key", "secret");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce(json({}));
    vi.stubGlobal("fetch", fetcher);
    await api("/api/attempts/start/1", { method: "POST" });
    await api("/api/attempts/27");
    expect(
      new Headers(fetcher.mock.calls[1][1].headers).get("X-Attempt-Key"),
    ).toBe("secret");
  });
  it("shares one refresh across concurrent 401s and retains auth on a retried 403", async () => {
    useAuth.getState().login("old", "refresh", 4, "tester", "ROLE_USER");
    let refreshCount = 0;
    const fetcher = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return json({
          data: {
            accessToken: "new",
            refreshToken: "rotated",
            userId: 4,
            username: "tester",
            role: "ROLE_USER",
          },
        });
      }
      if (new Headers(init.headers).get("Authorization") === "Bearer old")
        return json({}, 401);
      return url.endsWith("/restricted")
        ? json({ message: "Forbidden" }, 403)
        : json({ ok: true });
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await Promise.allSettled([
      api("/api/test"),
      api("/api/restricted"),
    ]);
    expect(refreshCount).toBe(1);
    expect(result[0].status).toBe("fulfilled");
    expect(result[1].status).toBe("rejected");
    expect(useAuth.getState().userId).toBe(4);
    expect(localStorage.getItem("token")).toBe("new");
  });
  it("does not attempt token refresh for failed login", async () => {
    localStorage.setItem("refreshToken", "refresh");
    const fetcher = vi
      .fn()
      .mockResolvedValue(json({ message: "Invalid" }, 401));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      api("/api/auth/login", { method: "POST" }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("reports non-JSON server errors without reading the body twice", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("upstream error", { status: 502 })),
    );
    await expect(api("/api/test")).rejects.toMatchObject({ status: 502 });
  });
});
