"use client";

import type { EditableQuestion } from "@/lib/api";
import { Lightbulb } from "lucide-react";
import TextareaAuto from "./TextareaAuto";
import { useId } from "react";

// 선택지 파싱 (항상 키를 기준으로 정렬하고 1부터 시작하는 숫자로 재할당)
const parseChoices = (input: string | undefined) => {
  try {
    const choices: Record<string, string> = input ? JSON.parse(input) : {};

    // 1. 키를 기준으로 정렬 (숫자 우선, 그 외 문자열)
    const sortedEntries = Object.entries(choices || {}).sort(
      ([keyA], [keyB]) => {
        const numA = Number(keyA);
        const numB = Number(keyB);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return keyA.localeCompare(keyB);
      },
    );

    // 2. 정렬된 순서대로 1부터 시작하는 키로 재매핑
    return sortedEntries.map(([key, text]) => ({
      key,
      text: text as string,
    }));
  } catch {
    return [];
  }
};

// 선택지 JSON으로 직렬화
const serializeChoices = (arr: { key: string; text: string }[]) => {
  const obj: Record<string, string> = {};
  arr.forEach((c) => (obj[c.key] = c.text));
  return JSON.stringify(obj);
};

function MCQChoicesEditor({
  q,
  onChange,
}: {
  q: EditableQuestion;
  onChange: (q: EditableQuestion) => void;
}) {
  const choicesArray = parseChoices(q.choices);
  const id = useId();

  const updateChoice = (index: number, newText: string) => {
    const updated = [...choicesArray];
    updated[index].text = newText;
    onChange({ ...q, choices: serializeChoices(updated) });
  };

  const addChoice = () => {
    // 다음 숫자 키를 생성합니다 (1, 2, 3...).
    const nextKey = (
      Math.max(0, ...choicesArray.map((c) => Number(c.key) || 0)) + 1
    ).toString();
    const updated = [...choicesArray, { key: nextKey, text: "" }];
    onChange({ ...q, choices: serializeChoices(updated) });
  };

  const removeChoice = (index: number) => {
    // 선택지 삭제 후 키를 숫자 순으로 재정렬합니다.
    const removed = choicesArray[index].key;
    const updated = choicesArray.filter((_, i) => i !== index);
    onChange({
      ...q,
      choices: serializeChoices(updated),
      answerKey: q.answerKey === removed ? "" : q.answerKey,
    });
  };

  return (
    <div className="space-y-2">
      {choicesArray.map((c, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <label htmlFor={`${id}-choice-${c.key}`} className="font-bold w-6"><span className="sr-only">보기 </span>{c.key}.</label>
          <input
            id={`${id}-choice-${c.key}`}
            className="flex-1 border p-2 rounded-sm"
            value={c.text || ""}
            placeholder="보기 내용을 입력하세요"
            onChange={(e) => updateChoice(idx, e.target.value)}
          />
          <button
            className="text-red-600 text-sm"
            onClick={() => removeChoice(idx)}
          >
            삭제
          </button>
        </div>
      ))}

      <button
        className="bg-gray-200 px-3 py-1 rounded-sm text-sm"
        onClick={addChoice}
      >
        + 보기 추가
      </button>

      {/* 정답 선택 */}
      <label htmlFor={`${id}-answer`} className="block text-sm font-medium">정답 선택</label>
      <select
        id={`${id}-answer`}
        className="mt-2 border p-2 rounded-sm w-full"
        value={q.answerKey || ""}
        onChange={(e) => onChange({ ...q, answerKey: e.target.value })}
      >
        <option value="">정답 선택</option>
        {choicesArray.map((c) => (
          <option key={c.key} value={c.key}>
            {c.key}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function QuestionItemEditor({
  q,
  index,
  onChange,
  onDelete,
}: {
  q: EditableQuestion;
  index: number;
  onChange: (q: EditableQuestion) => void;
  onDelete: () => void;
}) {
  const id = useId();
  return (
    <div className="border p-4 rounded-sm space-y-2 bg-white">
      <div className="flex justify-between">
        <h2 className="font-bold">문제 {index + 1}</h2>
        <button className="text-red-600" onClick={onDelete}>
          삭제
        </button>
      </div>

      {/* 문제 내용 */}
      <label htmlFor={`${id}-text`} className="block text-sm font-medium">문제 내용</label>
      <TextareaAuto
        id={`${id}-text`}
        className="w-full border p-2 rounded-sm"
        placeholder="문제 내용"
        value={q.text || ""}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
      />

      {/* 문제 타입 선택 */}
      <label htmlFor={`${id}-type`} className="block text-sm font-medium">문제 유형</label>
      <select
        id={`${id}-type`}
        className="border p-2 rounded-sm"
        value={q.type || "MCQ"}
        onChange={(e) => onChange({ ...q, type: e.target.value })}
      >
        <option value="MCQ">객관식(MCQ)</option>
        <option value="SUBJECTIVE">주관식(SUBJECTIVE)</option>
      </select>

      {/* 객관식 */}
      {q.type === "MCQ" && <MCQChoicesEditor q={q} onChange={onChange} />}

      {/* 주관식 */}
      {q.type === "SUBJECTIVE" && (
        <>
        <label htmlFor={`${id}-keywords`} className="block text-sm font-medium">정답 키워드 (쉼표 구분, 정답 속 쉼표는 \,)</label>
        <TextareaAuto
          id={`${id}-keywords`}
          className="w-full border p-2 rounded-sm"
          value={q.answerKeywords || ""}
          onChange={(e) => onChange({ ...q, answerKeywords: e.target.value })}
          placeholder="정답 키워드 (쉼표 구분)"
        />
        </>
      )}

      {/* 해설 */}
      <div>
        <label htmlFor={`${id}-explanation`} className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
          <Lightbulb className="w-4 h-4 text-green-600" /> 해설/피드백
        </label>
        <TextareaAuto
          id={`${id}-explanation`}
          className="border rounded-md p-3 w-full min-h-[4rem] focus:ring-green-500 focus:border-green-500 bg-green-50"
          value={q.explanation || ""}
          onChange={(e) => onChange({ ...q, explanation: e.target.value })}
          placeholder="문제 해설을 입력하세요."
        />
      </div>

      {/* 점수 */}
      <label htmlFor={`${id}-score`} className="block text-sm font-medium">점수</label>
      <input
        id={`${id}-score`}
        className="w-full border p-2 rounded-sm"
        type="number"
        value={q.score ?? ""}
        onChange={(e) => onChange({ ...q, score: Number(e.target.value) })}
        placeholder="점수"
      />
    </div>
  );
}
