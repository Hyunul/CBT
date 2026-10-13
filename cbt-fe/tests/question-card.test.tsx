import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import QuestionCard from "@/components/QuestionCard";

afterEach(cleanup);

it("connects each radio to its option label and sends the stored choice key", () => {
  const onChange = vi.fn();
  render(<QuestionCard q={{ id: 7, text: "정답을 고르세요", type: "MCQ", choices: JSON.stringify({ 1: "첫 번째 보기", 2: "두 번째 보기" }), score: 5 }} qNumber={1} value="1" onChange={onChange} />);
  const radio = screen.getByRole("radio", { name: "두 번째 보기" }) as HTMLInputElement;
  const label = screen.getByText("두 번째 보기").closest("label");
  expect(label?.htmlFor).toBe(radio.id);
  expect(radio.id).toBeTruthy();
  expect(radio.value).toBe("2");
  fireEvent.click(label!);
  expect(onChange).toHaveBeenCalledWith("2");
});
