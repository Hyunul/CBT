"use client";

import { useRef, useState } from "react";
import QuestionText from "@/components/QuestionText";

export interface StudyQuestion {
  id: number;
  text: string;
  type: "MCQ" | "SUBJECTIVE";
  choices: string | null;
  score: number;
  correctAnswer: string | null;
  explanation: string | null;
}

interface PracticalStudyProps {
  title: string;
  description?: string;
  seriesName?: string;
  questionCount: number;
  questions: StudyQuestion[];
}

function choicesFor(question: StudyQuestion): [string, string][] {
  if (question.type !== "MCQ" || !question.choices) return [];
  try {
    const choices: Record<string, string> = JSON.parse(question.choices);
    return Object.entries(choices).sort(([a], [b]) => {
      const numA = Number(a);
      const numB = Number(b);
      return !isNaN(numA) && !isNaN(numB) ? numA - numB : a.localeCompare(b);
    });
  } catch {
    return [];
  }
}

export default function PracticalStudy({ title, description, seriesName, questionCount, questions }: PracticalStudyProps) {
  const listRef = useRef<HTMLElement>(null);
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAll = () => {
    const open = !allExpanded;
    listRef.current?.querySelectorAll("details").forEach((details) => {
      details.open = open;
    });
    setAllExpanded(open);
  };

  return (
    <>
      <section className="rounded-2xl border bg-card p-8 shadow-xs">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[...(seriesName ? [seriesName] : []), "실기"].map((badge) => (
              <span key={badge} className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {badge}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {description || "문항을 학습하고 정답과 해설을 확인해보세요."}
          </p>
          <p className="text-sm text-muted-foreground">총 {questionCount}문항</p>
        </div>
      </section>

      <section ref={listRef} aria-labelledby="study-questions-title" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="study-questions-title" className="text-xl font-bold">실기 학습 문항</h2>
          {questions.length > 0 && (
            <button className="btn" onClick={toggleAll}>
              {allExpanded ? "모두 접기" : "모두 펼치기"}
            </button>
          )}
        </div>
        {questions.length === 0 && <p className="text-muted-foreground">등록된 문항이 없습니다.</p>}
        {questions.map((question, index) => (
          <article key={question.id} className="min-w-0 rounded-lg border bg-card p-4 sm:p-6">
            <h3 className="mb-2 text-sm font-semibold text-primary">문제 {index + 1}</h3>
            <QuestionText text={question.text} className="wrap-break-word text-base leading-relaxed text-card-foreground" />
            {question.type === "MCQ" && (
              <ul className="mt-6 space-y-3">
                {choicesFor(question).map(([key, text]) => (
                  <li key={key} className="flex min-w-0 gap-3 rounded-lg border p-4 font-question">
                    <span className="shrink-0 font-medium">{key}번</span>
                    <QuestionText text={text} className="min-w-0 wrap-break-word text-card-foreground" />
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-4 min-w-0 border-t pt-4" onToggle={() => {
              const details = listRef.current?.querySelectorAll("details");
              setAllExpanded(Boolean(details?.length) && Array.from(details ?? []).every((item) => item.open));
            }}>
              <summary className="cursor-pointer rounded-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
                정답 보기
              </summary>
              <div className="mt-3 space-y-3 font-question wrap-break-word whitespace-pre-wrap">
                <p>정답: {question.correctAnswer == null ? "등록된 정답이 없습니다." : `${question.correctAnswer}${question.type === "MCQ" ? "번" : ""}`}</p>
                {question.explanation && (
                  <div>
                    <p className="mb-1 font-semibold">해설</p>
                    <QuestionText text={question.explanation} />
                  </div>
                )}
              </div>
            </details>
          </article>
        ))}
      </section>
    </>
  );
}
