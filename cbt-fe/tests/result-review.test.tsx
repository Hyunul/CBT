import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import AttemptResultPage from "@/app/attempts/[id]/result/page";
import QuestionCard from "@/components/QuestionCard";
import { api } from "@/lib/api";
import { apiUrl } from "@/lib/api-url";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({ api: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const correctItem = {
  questionId: 11,
  questionText: "첫째 줄\n  둘째 줄",
  type: "MCQ",
  choices: '{"1":"첫 선택지","2":"둘째 선택지"}',
  selectedChoices: "1",
  responseText: null,
  correctAnswer: "1",
  isCorrect: true,
  score: 5,
  explanation: "상세 해설",
};

it("filters incorrect and unanswered answers separately while preserving question numbers and jump focus", async () => {
  vi.mocked(api).mockResolvedValue([
    correctItem,
    { ...correctItem, questionId: 12, selectedChoices: "2", isCorrect: false },
    { ...correctItem, questionId: 13, selectedChoices: null, isCorrect: false },
    { ...correctItem, questionId: 14, type: "SUBJECTIVE", responseText: "   ", isCorrect: false },
    { ...correctItem, questionId: 15, type: "SUBJECTIVE", responseText: "틀린 답안", isCorrect: false },
  ]);
  render(<AttemptResultPage />);
  await screen.findByRole("heading", { name: "문제 1" });
  expect(screen.getByRole("button", { name: "전체 (5)" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("button", { name: "오답 (2)" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "미응답 (2)" })).toBeTruthy();
  expect(screen.getAllByText("상세 해설").every((el) => !el.closest("details")?.hasAttribute("open"))).toBe(true);
  expect(screen.getAllByText(correctItem.questionText, { exact: true, normalizer: (text) => text })[0].className).toContain("whitespace-pre-wrap");

  fireEvent.click(screen.getByRole("button", { name: "오답 (2)" }));
  expect(screen.queryByRole("heading", { name: "문제 1" })).toBeNull();
  expect(screen.getByRole("heading", { name: "문제 2" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "문제 5" })).toBeTruthy();
  const navigation = screen.getByRole("navigation", { name: "문항 번호 바로가기" });
  expect(within(navigation).getAllByRole("link")).toHaveLength(2);
  const jump = within(navigation).getByRole("link", { name: "문제 5, 오답" });
  expect(jump.getAttribute("href")).toBe("#review-question-15");
  fireEvent.click(jump);
  expect(document.activeElement).toBe(screen.getByRole("heading", { name: "문제 5" }));
  expect(screen.getByText("둘째 선택지").parentElement?.textContent).toBe("2번: 둘째 선택지");

  fireEvent.click(screen.getByRole("button", { name: "미응답 (2)" }));
  expect(screen.getByRole("heading", { name: "문제 3" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "문제 4" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "문제 2" })).toBeNull();
  expect(screen.getByRole("status").textContent).toBe("미응답 문항 2개");
  fireEvent.click(screen.getByRole("button", { name: "전체 (5)" }));
  expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
});

it("renders image choices for both the selected and correct answers with height limits", async () => {
  vi.mocked(api).mockResolvedValue([{
    ...correctItem,
    choices: JSON.stringify({ 1: "[이미지: 정답#1.png]", 2: "내 보기 [이미지: selected.png]" }),
    selectedChoices: "2",
    isCorrect: false,
  }]);
  render(<AttemptResultPage />);
  const images = await screen.findAllByRole("img", { name: "문제 이미지" });
  expect(images.map((image) => image.getAttribute("src"))).toEqual([
    apiUrl("/api/question-images/selected.png"),
    apiUrl("/api/question-images/" + encodeURIComponent("정답#1.png")),
  ]);
  for (const image of images) {
    expect(image.className).toContain("max-h-40");
    expect(image.parentElement?.className).toContain("font-question");
  }
  expect(images[0].parentElement?.parentElement?.textContent).toBe("2번: 내 보기 ");
  expect(images[1].parentElement?.parentElement?.textContent).toBe("1번: ");
  expect(screen.queryByText(/\[이미지:/)).toBeNull();
});

it("explains empty filters and allows returning to all questions", async () => {
  vi.mocked(api).mockResolvedValue([correctItem]);
  render(<AttemptResultPage />);
  await screen.findByRole("heading", { name: "문제 1" });
  fireEvent.click(screen.getByRole("button", { name: "오답 (0)" }));
  expect(screen.getByText("오답 문항이 없습니다.")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "문항 번호 바로가기" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "미응답 (0)" }));
  expect(screen.getByText("미응답 문항이 없습니다.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "전체 (1)" }));
  expect(screen.getByRole("heading", { name: "문제 1" })).toBeTruthy();
});

it("uses Korean question and answer labels and the question font while preserving plain text", () => {
  const onChange = vi.fn();
  render(<QuestionCard q={{ id: 1, text: correctItem.questionText, type: "SUBJECTIVE", choices: null, score: 5 }} qNumber={3} value="저장한 답안" onChange={onChange} />);
  expect(screen.getByRole("heading", { name: "문제 3" }).getAttribute("tabindex")).toBe("-1");
  const text = screen.getByText(correctItem.questionText, { exact: true, normalizer: (value) => value });
  expect(text.className).toContain("whitespace-pre-wrap");
  expect(text.className).toContain("font-question");
  expect(text.className).not.toContain("bg-slate-900");
  const answer = screen.getByRole("textbox", { name: "답안" });
  expect((answer as HTMLTextAreaElement).value).toBe("저장한 답안");
  expect(answer.getAttribute("aria-describedby")).toBe(text.id);
  fireEvent.change(answer, { target: { value: "새 답안" } });
  expect(onChange).toHaveBeenCalledWith("새 답안");
});
