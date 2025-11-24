"use client";
export default function QuestionCard({ q, value, onChange }: any) {
  const choices = q.type === "MCQ" ? JSON.parse(q.choices || "[]") : [];

  return (
    <div className="border p-4 rounded-lg mb-4 bg-white">
      <h2 className="font-semibold mb-3 whitespace-pre-line">{q.text}</h2>

      {q.type === "MCQ" ? (
        <ul className="space-y-2">
          {choices.map((c: string, i: number) => (
            <li key={i}>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={value === c}
                  onChange={() => onChange(c)}
                />
                {c}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          placeholder="답변을 입력하세요"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
