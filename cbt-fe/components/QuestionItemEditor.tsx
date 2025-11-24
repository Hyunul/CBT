"use client";

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

      <textarea
        className="w-full border p-2 rounded"
        placeholder="문제 내용"
        value={q.text}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
      />

      <select
        className="border p-2 rounded"
        value={q.type}
        onChange={(e) => onChange({ ...q, type: e.target.value })}
      >
        <option value="MCQ">객관식(MCQ)</option>
        <option value="SUBJECTIVE">주관식(SUBJECTIVE)</option>
      </select>

      {q.type === "MCQ" && (
        <div className="space-y-2">
          <textarea
            className="w-full border p-2 rounded"
            value={q.choices || ""}
            onChange={(e) => onChange({ ...q, choices: e.target.value })}
            placeholder='["보기1","보기2"] 같은 JSON 형태'
          />
          <input
            className="w-full border p-2 rounded"
            value={q.answerKey || ""}
            onChange={(e) => onChange({ ...q, answerKey: e.target.value })}
            placeholder="정답"
          />
        </div>
      )}

      {q.type === "SUBJECTIVE" && (
        <textarea
          className="w-full border p-2 rounded"
          value={q.answerKeywords || ""}
          onChange={(e) => onChange({ ...q, answerKeywords: e.target.value })}
          placeholder="정답 키워드 (쉼표 구분)"
        />
      )}

      <input
        className="w-full border p-2 rounded"
        value={q.score}
        type="number"
        onChange={(e) => onChange({ ...q, score: Number(e.target.value) })}
        placeholder="점수"
      />
    </div>
  );
}
