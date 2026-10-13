import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExamDetailPage from "@/app/exam/[id]/page";
import { api } from "@/lib/api";

const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => router,
}));
vi.mock("@/lib/api", () => ({ api: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("loads every practical question and collapses answers while preserving related exams", async () => {
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/api/exams/7") return { data: {
      id: 7, title: "실기 기출", description: "학습용 설명", type: "PRACTICAL",
      questionCount: 2, durationSec: 600, series: { id: 3, name: "정보처리기사" },
    } };
    if (path === "/api/exams/7/study") return { data: [
      { id: 11, text: "객관식 문항", type: "MCQ", choices: '{"2":"두 번째 보기","1":"첫 번째 보기"}', score: 5, correctAnswer: "2", explanation: "객관식 해설" },
      { id: 12, text: "주관식 문항", type: "SUBJECTIVE", choices: null, score: 5, correctAnswer: "주관식 답안", explanation: null },
    ] };
    if (path === "/api/exams?seriesId=3") return { data: [
      { id: 7, title: "실기 기출" }, { id: 8, title: "관련 회차" },
    ] };
    throw new Error(`Unexpected request: ${path}`);
  });
  const { container } = render(<ExamDetailPage />);
  await screen.findByRole("heading", { name: "실기 기출" });
  expect(screen.getByText("학습용 설명")).toBeTruthy();
  expect(screen.getByText("정보처리기사")).toBeTruthy();
  expect(screen.getByText("실기", { exact: true })).toBeTruthy();
  expect(screen.getByText("총 2문항")).toBeTruthy();
  expect(screen.getAllByRole("heading", { level: 3 }).map((el) => el.textContent)).toEqual(["문제 1", "문제 2"]);
  expect(screen.getByText("객관식 문항").className).toContain("font-question");
  expect(screen.getAllByRole("listitem").map((el) => el.textContent)).toEqual(["1번첫 번째 보기", "2번두 번째 보기"]);
  const details = Array.from(container.querySelectorAll("details"));
  expect(details).toHaveLength(2);
  expect(details.every((el) => !el.open)).toBe(true);
  expect(details[0].querySelector("summary")?.textContent).toBe("정답 보기");
  expect(details[0].textContent).toContain("정답: 2번");
  expect(details[0].textContent).toContain("객관식 해설");
  expect(details[1].textContent).toContain("정답: 주관식 답안");
  expect(details[1].textContent).not.toContain("주관식 답안번");
  expect(details[1].textContent).not.toContain("해설");
  fireEvent.click(screen.getByRole("button", { name: "모두 펼치기" }));
  expect(details.every((el) => el.open)).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "모두 접기" }));
  expect(details.every((el) => !el.open)).toBe(true);
  await screen.findByRole("link", { name: /관련 회차/ });
  expect(screen.queryByRole("button", { name: "시험 시작" })).toBeNull();
  expect(screen.queryByText("CBT 모의고사")).toBeNull();
  expect(screen.queryByText(/자동 제출/)).toBeNull();
  expect(vi.mocked(api).mock.calls.map(([path]) => path)).toEqual([
    "/api/exams/7", "/api/exams/7/study", "/api/exams?seriesId=3",
  ]);
});

it("defaults exams without a type to the written mock exam flow", async () => {
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/api/exams/7") return { data: { id: 7, title: "필기 기출", questionCount: 1, durationSec: 600 } };
    if (path === "/api/exams/7/questions") return { data: [{ id: 11, text: "미리보기 문항" }] };
    if (path.startsWith("/api/ranking/")) return [];
    if (path === "/api/attempts/start/7") return 9;
    throw new Error(`Unexpected request: ${path}`);
  });
  render(<ExamDetailPage />);
  const start = await screen.findByRole("button", { name: "시험 시작" });
  expect(screen.getByText("CBT 모의고사")).toBeTruthy();
  expect(screen.getByText("미리보기 문항")).toBeTruthy();
  expect(screen.queryByText("정답 보기")).toBeNull();
  expect(api).not.toHaveBeenCalledWith("/api/exams/7/study");
  fireEvent.click(start);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/attempts/9"));
});
