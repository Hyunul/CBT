"use client";

import { Lightbulb } from "lucide-react";

// 선택지 파싱 (항상 키를 기준으로 정렬)
const parseChoices = (choices: any) => {
  try {
    if (typeof choices === "string") choices = JSON.parse(choices);
    // 키(A, B, C...)를 기준으로 항상 정렬하여 순서를 보장합니다.
    return Object.entries(choices || {})
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, text]) => ({ key, text: text as string }));
  } catch {
    return [];
  }
};

// 선택지 JSON으로 직렬화
const serializeChoices = (arr: { key: string; text: string }[]) => {
  const obj: any = {};
  arr.forEach((c) => (obj[c.key] = c.text));
  return JSON.stringify(obj);
};

function MCQChoicesEditor({ q, onChange }: any) {
  const choicesArray = parseChoices(q.choices);

  const updateChoice = (index: number, newText: string) => {
    const updated = [...choicesArray];
    updated[index].text = newText;
    onChange({ ...q, choices: serializeChoices(updated) });
  };

  const addChoice = () => {
    // 다음 알파벳 키를 생성합니다 (A, B, C...).
    const nextKey = String.fromCharCode("A".charCodeAt(0) + choicesArray.length);
    const updated = [...choicesArray, { key: nextKey, text: "" }];
    onChange({ ...q, choices: serializeChoices(updated) });
  };

  const removeChoice = (index: number) => {
    // 선택지 삭제 후 키를 알파벳 순으로 재정렬합니다.
    const updated = choicesArray
      .filter((_, i) => i !== index)
      .map((c, idx) => ({
        key: String.fromCharCode("A".charCodeAt(0) + idx),
        text: c.text,
      }));
    onChange({ ...q, choices: serializeChoices(updated) });
  };

  return (
    <div className="space-y-2">
      {choicesArray.map((c, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="font-bold w-6">{c.key}.</span>
          <input
            className="flex-1 border p-2 rounded"
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
        className="bg-gray-200 px-3 py-1 rounded text-sm"
        onClick={addChoice}
      >
        + 보기 추가
      </button>

      {/* 정답 선택 */}
      <select
        className="mt-2 border p-2 rounded w-full"
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
}: any) {
  return (
    <div className="border p-4 rounded space-y-2 bg-white">
      <div className="flex justify-between">
        <h2 className="font-bold">문제 {index + 1}</h2>
        <button className="text-red-600" onClick={onDelete}>
          삭제
        </button>
      </div>

      {/* 문제 내용 */}
      <textarea
        className="w-full border p-2 rounded"
        placeholder="문제 내용"
        value={q.text || ""}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
      />

      {/* 문제 타입 선택 */}
      <select
        className="border p-2 rounded"
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
        <textarea
          className="w-full border p-2 rounded"
          value={q.answerKeywords || ""}
          onChange={(e) => onChange({ ...q, answerKeywords: e.target.value })}
          placeholder="정답 키워드 (쉼표 구분)"
        />
      )}

      {/* 해설 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <Lightbulb className="w-4 h-4 text-green-600" /> 해설/피드백
        </label>
        <textarea
          className="border rounded-md p-3 w-full h-16 focus:ring-green-500 focus:border-green-500 resize-y bg-green-50"
          value={q.explanation || ""}
          onChange={(e) => onChange({ ...q, explanation: e.target.value })}
          placeholder="문제 해설을 입력하세요."
        />
      </div>

      {/* 점수 */}
      <input
        className="w-full border p-2 rounded"
        type="number"
        value={q.score ?? ""}
        onChange={(e) => onChange({ ...q, score: Number(e.target.value) })}
        placeholder="점수"
      />
    </div>
  );
}
