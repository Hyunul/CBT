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
  value: string | undefined;
  onChange: (value: string) => void;
}

export default function QuestionCard({
  q,
  value,
  onChange,
}: QuestionCardProps) {
  let choicesArray: [string, string][] = [];

  if (q.type === "MCQ" && q.choices) {
    try {
      // ⭐ 1. JSON 문자열을 객체로 파싱:
      // {"A": "Choice A text", "B": "Choice B text"}
      const choicesObject: Record<string, string> = JSON.parse(q.choices);

      // ⭐ 2. 객체를 배열([key, value])로 변환하여 map이 가능하도록 함:
      // [ ['A', 'Choice A text'], ['B', 'Choice B text'] ]
      choicesArray = Object.entries(choicesObject);
    } catch (e) {
      console.error(`Question ${q.id} 선택지 JSON 파싱 오류:`, e);
      // 에러 발생 시 빈 배열로 유지하여 렌더링 오류 방지
    }
  }

  return (
    <div className="border p-4 rounded-lg mb-4 bg-white shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg whitespace-pre-line">{q.text}</h2>
        <span
          className="flex-shrink-0 text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1 shadow-sm text-center w-[10%]"
          style={{ minWidth: "30px" }}
        >
          {q.type === "MCQ" ? "객관식" : "주관식"} ({q.score}점)
        </span>
      </div>

      {q.type === "MCQ" ? (
        <ul className="space-y-3">
          {choicesArray.map(([key, text]) => (
            <li
              key={key}
              className="p-2 border rounded-md hover:bg-blue-50 transition duration-150"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  // value가 key(A, B, C...)와 일치하는지 확인
                  checked={value === key}
                  // 선택 시 key(A, B, C...)를 답으로 저장
                  onChange={() => onChange(key)}
                />
                <span className="text-gray-700">
                  <span className="font-bold text-blue-700 mr-2">{key}.</span>
                  {text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <textarea
          className="w-full border border-gray-300 rounded p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-none"
          rows={4}
          placeholder="답변을 입력하세요"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
