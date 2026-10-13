import { afterEach, beforeEach, it, expect, vi } from "vitest";
import type { Ref } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import AttemptPage from "@/app/attempts/[id]/page";
import { api } from "@/lib/api";
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => router,
}));
const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("@/lib/api", () => ({ api: vi.fn() }));
vi.mock("@/components/Timer", () => ({ default: () => null }));
vi.mock("@/components/QuestionCard", () => ({
  default: ({
    value,
    onChange,
    headingRef,
  }: {
    value: string;
    onChange: (v: string) => void;
    headingRef: Ref<HTMLHeadingElement>;
  }) => (
    <>
    <h2 ref={headingRef} tabIndex={-1}>문항 제목</h2>
    <input
      aria-label="answer"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
    </>
  ),
}));
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
  });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function mockAttempt() {
  vi.mocked(api).mockImplementation(async (path) => path === "/api/attempts/7" ? {
    attemptId: 7,
    examId: 1,
    examTitle: "Exam",
    durationSec: 600,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    questions: [
      { id: 1, text: "a", type: "MCQ", score: 5 },
      { id: 2, text: "b", type: "MCQ", score: 5 },
      { id: 3, text: "c", type: "SUBJECTIVE", score: 5 },
    ],
    answers: [{ questionId: 1, selectedChoices: "1" }, { questionId: 3, responseText: "   " }],
  } : null);
}

it("shows unanswered numbers and only submits after final confirmation with the latest answers", async () => {
  mockAttempt();
  render(<AttemptPage />);
  const input = await screen.findByLabelText("answer");
  fireEvent.change(input, { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "시험 제출" }));
  expect(screen.getByRole("dialog").hasAttribute("open")).toBe(true);
  expect(screen.getByText("응답 1 / 전체 3 문항")).toBeTruthy();
  expect(screen.getByText("미응답 번호: 2, 3")).toBeTruthy();
  expect(screen.getByText("제출 후에는 답안을 수정할 수 없습니다.")).toBeTruthy();
  expect(vi.mocked(api).mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "돌아가서 검토" }));
  expect(vi.mocked(api).mock.calls.some(([path]) => path.endsWith("/submit"))).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "시험 제출" }));
  fireEvent.click(screen.getByRole("button", { name: "최종 제출" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/attempts/7/result"));
  const submission = vi.mocked(api).mock.calls.find(([path]) => path.endsWith("/submit"));
  expect(JSON.parse(submission![1]!.body as string)[0].selectedChoices).toBe("3");
});

it("focuses the question heading after navigation", async () => {
  mockAttempt();
  render(<AttemptPage />);
  await screen.findByLabelText("answer");
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  expect(document.activeElement).toBe(screen.getByRole("heading", { name: "문항 제목" }));
});
it("focuses a visible heading without jumping the page", async () => {
  mockAttempt();
  render(<AttemptPage />);
  await screen.findByLabelText("answer");
  const heading = screen.getByRole("heading", { name: "문항 제목" });
  const bounds = vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({
    top: 200, bottom: 220, left: 0, right: 100, width: 100, height: 20, x: 0, y: 200, toJSON: () => ({}),
  });
  const focus = vi.spyOn(heading, "focus");
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(document.activeElement).toBe(heading);
  expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  bounds.mockRestore();
  focus.mockRestore();
});
it("restores saved answers and retains untouched answers in autosave", async () => {
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/api/attempts/7"
      ? {
          attemptId: 7,
          examId: 1,
          examTitle: "Exam",
          durationSec: 600,
          startedAt: new Date().toISOString(),
          submittedAt: null,
          questions: [
            { id: 1, text: "a", type: "MCQ", score: 5 },
            { id: 2, text: "b", type: "MCQ", score: 5 },
          ],
          answers: [
            { questionId: 1, selectedChoices: "1" },
            { questionId: 2, selectedChoices: "2" },
          ],
        }
      : null,
  );
  render(<AttemptPage />);
  const input = await screen.findByLabelText("answer");
  expect((input as HTMLInputElement).value).toBe("1");
  fireEvent.change(input, { target: { value: "3" } });
  await waitFor(
    () =>
      expect(
        vi
          .mocked(api)
          .mock.calls.some(
            ([path, init]) =>
              path.endsWith("/answers") &&
              JSON.parse(init!.body as string)[1].selectedChoices === "2",
          ),
      ).toBe(true),
    { timeout: 2000 },
  );
});
