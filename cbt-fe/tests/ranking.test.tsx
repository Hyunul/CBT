import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import RankingPage from "@/app/ranking/page";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("renders series links and solved counts, then an empty-list message", async () => {
  vi.mocked(api).mockResolvedValueOnce([
    { rank: 1, seriesId: 3, seriesName: "정보처리기사", solvedCount: 1234 },
    { rank: 2, seriesId: 8, seriesName: "전기기사", solvedCount: 50 },
  ]).mockResolvedValueOnce([]);

  const { unmount } = render(<RankingPage />);
  const link = await screen.findByRole("link", { name: "정보처리기사" });
  expect(link.getAttribute("href")).toBe("/series/3");
  const row = within(link.closest("tr")!);
  expect(row.getByRole("cell", { name: "1" })).toBeTruthy();
  expect(row.getByRole("cell", { name: (1234).toLocaleString() })).toBeTruthy();
  const secondLink = screen.getByRole("link", { name: "전기기사" });
  expect(secondLink.getAttribute("href")).toBe("/series/8");
  expect(within(secondLink.closest("tr")!).getByRole("cell", { name: "50" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "자격증 종목 랭킹" })).toBeTruthy();
  expect(screen.getByText("많이 풀린 자격증 종목 순위입니다.")).toBeTruthy();
  expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent?.trim())).toEqual([
    "순위", "자격증 종목", "풀이 횟수",
  ]);
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(api).toHaveBeenCalledExactlyOnceWith("/api/ranking/series?limit=50");

  unmount();
  render(<RankingPage />);
  expect(await screen.findByText("아직 풀이 기록이 없습니다.")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
  expect(vi.mocked(api).mock.calls.map(([path]) => path)).toEqual([
    "/api/ranking/series?limit=50", "/api/ranking/series?limit=50",
  ]);
});
