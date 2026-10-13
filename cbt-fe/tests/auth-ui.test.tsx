import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import SignupPage from "@/app/signup/page";
import { api, ApiError } from "@/lib/api";
import Input from "@/components/Input";

const { router, login } = vi.hoisted(() => ({ router: { push: vi.fn(), replace: vi.fn() }, login: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/store/useAuth", () => ({ useAuth: () => ({ login }) }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(), api: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.history.replaceState(null, "", "/login?returnTo=%2Fmy-history");
});
afterEach(() => cleanup());

function loginResponse(error?: Error) {
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/api/auth/providers") return { data: [] };
    if (error) throw error;
    return { data: { accessToken: "access", refreshToken: "refresh", userId: 1, username: "user", role: "ROLE_USER" } };
  });
}
async function sendLogin() {
  fireEvent.change(screen.getByLabelText("아이디"), { target: { value: "user" } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password" } });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
  await screen.findByRole("button", { name: "로그인" });
}

it("returns to the requested internal page after password login", async () => {
  loginResponse();
  render(<LoginPage />);
  await sendLogin();
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/my-history"));
  expect(login).toHaveBeenCalled();
});

it("associates credential errors with the first field and focuses it", async () => {
  loginResponse(new ApiError("Invalid credentials", 401));
  render(<LoginPage />);
  await sendLogin();
  const alert = await screen.findByRole("alert");
  const username = screen.getByLabelText("아이디");
  expect(alert.textContent).toContain("아이디 또는 비밀번호가 올바르지 않습니다");
  expect(username.getAttribute("aria-invalid")).toBe("true");
  expect(username.getAttribute("aria-describedby")).toBe(alert.id);
  await waitFor(() => expect(document.activeElement).toBe(username));
});

it.each([
  [new TypeError("Failed to fetch"), "네트워크 연결"],
  [new ApiError("Unavailable", 503), "서버에서 로그인을 처리하지 못했습니다"],
])("keeps service failures distinct from credential errors", async (error, message) => {
  loginResponse(error);
  render(<LoginPage />);
  await sendLogin();
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain(message);
  expect(screen.getByLabelText("아이디").getAttribute("aria-invalid")).toBeNull();
});

it.each([
  ["이미 존재하는 이메일입니다.", "이메일"],
  ["이미 존재하는 아이디입니다.", "아이디"],
])("focuses the conflicting signup field", async (message, label) => {
  vi.mocked(api).mockRejectedValue(new ApiError(message, 409));
  render(<SignupPage />);
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByLabelText("아이디"), { target: { value: "user" } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password" } });
  fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
  const alert = await screen.findByRole("alert");
  const field = screen.getByLabelText(label);
  expect(alert.textContent).toContain(`이미 사용 중인 ${label}`);
  expect(field.getAttribute("aria-describedby")).toBe(alert.id);
  await waitFor(() => expect(document.activeElement).toBe(field));
});

it("focuses the invalid password without sending a signup request", async () => {
  render(<SignupPage />);
  fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByLabelText("아이디"), { target: { value: "user" } });
  fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "short" } });
  fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
  await screen.findByRole("alert");
  expect(document.activeElement).toBe(screen.getByLabelText("비밀번호"));
  expect(api).not.toHaveBeenCalled();
});

it("retains a caller's description while associating an input error", () => {
  render(<Input id="field" label="필드" aria-describedby="help" error="오류" />);
  expect(screen.getByLabelText("필드").getAttribute("aria-describedby")).toBe("help field-error");
  expect(screen.getByRole("alert").id).toBe("field-error");
});
