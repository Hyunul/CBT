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

  if (!result) return <div className="p-8">결과를 불러오는 중...</div>;

  return (
    <main className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">시험 결과</h1>

      <div className="p-4 bg-white rounded shadow">
        <p className="text-lg">총 점수: {result.totalScore}점</p>
        <p>정답 개수: {result.correctCount}개</p>
        <p>오답 개수: {result.wrongCount}개</p>
        <p>전체 문항: {result.questionCount}개</p>
      </div>

      <a
        href="/"
        className="block mt-4 text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        홈으로 돌아가기
      </a>
    </main>
  );
}
