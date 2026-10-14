"use client";

import React from "react";
import QuestionText from "@/components/QuestionText";

interface QuestionDetail {
  id: number;
  text: string;
  type: "MCQ" | "SUBJECTIVE";
  choices: string | null;
  score: number;
}

interface QuestionCardProps {
  q: QuestionDetail;
  qNumber: number;
  value: string | undefined;
  onChange: (value: string) => void;
  headingRef?: React.Ref<HTMLHeadingElement>;
}

export default function QuestionCard({
  q,
  qNumber,
  value,
  onChange,
  headingRef,
}: QuestionCardProps) {
  let choicesArray: [string, string][] = [];

  if (q.type === "MCQ" && q.choices) {
    try {
      const choicesObject: Record<string, string> = JSON.parse(q.choices);
      // 객체를 배열로 변환하고 키를 기준으로 정렬하여 순서 보장 (숫자 키 우선)
      choicesArray = Object.entries(choicesObject).sort(([keyA], [keyB]) => {
        const numA = Number(keyA);
        const numB = Number(keyB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return keyA.localeCompare(keyB);
      });
    } catch (e) {
      console.error(`문제 ${q.id} 선택지 JSON 파싱 오류:`, e);
    }
  }

  return (
    <div className="min-w-0 bg-card border rounded-lg p-4 sm:p-6">
      <div className="mb-6">
        <h2 ref={headingRef} id={`question-${q.id}-title`} tabIndex={-1} style={{ scrollMarginTop: "calc(var(--navbar-height) + var(--attempt-header-height, 10rem) + 1rem)" }} className="text-sm font-semibold text-primary mb-2">
          문제 {qNumber}
        </h2>
        <QuestionText id={`question-${q.id}-text`} text={q.text} className="block wrap-break-word text-card-foreground text-base leading-relaxed" />
      </div>

      {q.type === "MCQ" ? (
        <fieldset aria-labelledby={`question-${q.id}-title question-${q.id}-text`} className="min-w-0">
        <ul className="space-y-3">
          {choicesArray.map(([key, text]) => (
            <li
              key={key}
              className={`border rounded-lg transition-all duration-200 ${
                value === key
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-accent"
              }`}
            >
              <label htmlFor={`q-${q.id}-choice-${key}`} className="flex items-center gap-4 p-4 cursor-pointer">
                <input
                  id={`q-${q.id}-choice-${key}`}
                  type="radio"
                  name={`q-${q.id}`}
                  value={key}
                  className="h-4 w-4 shrink-0 text-primary focus:ring-primary border-muted"
                  checked={value === key}
                  onChange={() => onChange(key)}
                />
                <QuestionText text={text} className="min-w-0 wrap-break-word font-question font-medium text-card-foreground" imageClassName="max-h-40 object-contain object-left" />
              </label>
            </li>
          ))}
        </ul>
        </fieldset>
      ) : (
        <div>
          <p className="text-sm font-semibold text-primary mb-2">답안</p>
          <textarea
            aria-label="답안"
            aria-describedby={`question-${q.id}-text`}
            className="input font-question w-full h-32"
            placeholder="답안을 입력하세요..."
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
