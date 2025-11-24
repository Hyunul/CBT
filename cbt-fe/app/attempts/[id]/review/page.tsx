"use client";

import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AttemptReviewPage() {
  const { id } = useParams();
  const [review, setReview] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    api<{ data: any[] }>(`/api/attempts/${id}/review`)
      .then((res) => setReview(res.data))
      .catch(console.error);
  }, [id]);

  if (!review.length) return <div className="p-6">결과를 불러오는 중...</div>;

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">오답 · 정답 확인</h1>

      {review.map((r, i) => (
        <div key={r.questionId} className="p-4 bg-white rounded shadow border">
          <h2 className="font-semibold mb-2">
            {i + 1}. {r.questionText}
          </h2>

          <div className="mt-2">
            <p>
              <span className="font-semibold">내 답: </span>
              {r.type === "MCQ" ? r.selectedChoices : r.responseText}
            </p>
            <p>
              <span className="font-semibold">정답: </span>
              {r.correctAnswer}
            </p>
            <p className={r.isCorrect ? "text-green-600" : "text-red-600"}>
              {r.isCorrect ? "정답입니다 ✔" : "오답입니다 ✘"}
            </p>
          </div>
        </div>
      ))}

      <a
        href="/"
        className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        홈으로 돌아가기
      </a>
    </main>
  );
}
