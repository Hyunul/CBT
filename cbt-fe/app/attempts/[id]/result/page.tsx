"use client";

import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AttemptResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    api<{ data: any }>(`/api/attempts/${id}/result`)
      .then((res) => setResult(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!result) return <div className="p-8">결과 로딩 중...</div>;

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">시험 결과</h1>
      <p className="text-xl font-semibold">총점: {result.totalScore}</p>

      {result.answers.map((a: any) => (
        <div key={a.questionId} className="border p-4 rounded-lg bg-white">
          <h2 className="font-semibold mb-2 whitespace-pre-line">
            {a.questionText}
          </h2>

          <p>
            <b>내 답변:</b>{" "}
            {a.type === "MCQ" ? a.selectedChoices : a.responseText}
          </p>

          <p>
            <b>정답:</b> {a.correctAnswer}
          </p>

          <p>
            <b>점수:</b> {a.scoreAwarded} / {a.score}
          </p>

          <p className={a.isCorrect ? "text-green-600" : "text-red-600"}>
            {a.isCorrect ? "정답" : "오답"}
          </p>
        </div>
      ))}
    </main>
  );
}
