"use client";

import React from "react";

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
}

export default function QuestionCard({
  q,
  qNumber,
  value,
  onChange,
}: QuestionCardProps) {
  let choicesArray: [string, string][] = [];

  if (q.type === "MCQ" && q.choices) {
    try {
      const choicesObject: Record<string, string> = JSON.parse(q.choices);
      // 객체를 배열로 변환하고 키(A, B, C...)를 기준으로 정렬하여 순서 보장
      choicesArray = Object.entries(choicesObject).sort(([keyA], [keyB]) =>
        keyA.localeCompare(keyB)
      );
    } catch (e) {
      console.error(`Question ${q.id} 선택지 JSON 파싱 오류:`, e);
    }
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary mb-2">Question {qNumber}</p>
        <div className="bg-slate-900 text-slate-50 p-5 rounded-lg font-mono text-base whitespace-pre-wrap border border-slate-800 shadow-sm leading-relaxed">
          {q.text}
        </div>
      </div>

      {q.type === "MCQ" ? (
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
              <label className="flex items-center gap-4 p-4 cursor-pointer">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  className="h-4 w-4 text-primary focus:ring-primary border-muted"
                  checked={value === key}
                  onChange={() => onChange(key)}
                />
                <span className="font-medium text-card-foreground">{text}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p className="text-sm font-semibold text-primary mb-2">Your Answer</p>
          <textarea
            className="input w-full h-32"
            placeholder="답변을 입력하세요..."
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}