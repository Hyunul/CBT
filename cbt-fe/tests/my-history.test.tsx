import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import MyHistoryPage from "@/app/my-history/page";
import { api } from "@/lib/api";

vi.mock("@/store/useAuth", () => ({
  useAuth: () => ({ token: "access", isLoaded: true }),
}));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api")>(), api: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

it("renders progress, expired and graded history with their dates and actions", async () => {
  const startedAt = "2026-10-01T01:00:00Z";
  const submittedAt = "2026-10-02T02:00:00Z";
  vi.mocked(api).mockResolvedValue({
    content: [
      { attemptId: 1, examTitle: "진행 시험", submissionDate: startedAt, finalScore: 90, status: "IN_PROGRESS" },
      { attemptId: 2, examTitle: "만료 시험", submissionDate: startedAt, finalScore: 70, status: "EXPIRED" },
      { attemptId: 3, examTitle: "제출 시험", submissionDate: submittedAt, finalScore: 80, status: "GRADED" },
    ],
    number: 0, totalPages: 1, totalElements: 3,
  });
  render(<MyHistoryPage />);
  await screen.findByRole("heading", { name: "진행 시험" });
  expect(api).toHaveBeenCalledWith("/api/attempts/history?page=0");

  const formatDate = (value: string) => new Date(value).toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  for (const [title, badge, action, href, date] of [
    ["진행 시험", "진행중", "이어서 응시", "/attempts/1", startedAt],
    ["만료 시험", "시간 종료", "제출 완료하기", "/attempts/2", startedAt],
    ["제출 시험", "채점 완료", "결과 보기", "/attempts/3/result", submittedAt],
  ]) {
    const card = screen.getByRole("heading", { name: title }).parentElement!.parentElement!;
    const row = within(card);
    expect(row.getByText(badge).className).toContain("whitespace-nowrap");
    expect(row.getByRole("link", { name: action }).getAttribute("href")).toBe(href);
    expect(row.getAllByRole("link")).toHaveLength(1);
    expect(row.getByText(formatDate(date))).toBeTruthy();
    if (title === "제출 시험") {
      expect(row.getByText("80점").className).toContain("whitespace-nowrap");
    } else {
      expect(row.queryByText(/\d+점/)).toBeNull();
      expect(row.getByText("-")).toBeTruthy();
      expect(row.getByRole("link", { name: action }).className).toContain("whitespace-nowrap");
    }
  }
});
