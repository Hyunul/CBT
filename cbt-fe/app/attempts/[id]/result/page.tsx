"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface QuestionResult {
  id: number;
  text: string;
  type: string;
  choices?: string;
  score: number;
  responseText?: string;
  selectedChoices?: string;
  isCorrect?: boolean | null;
  scoreAwarded?: number;
}

export default function AttemptResultPage({
  params,
}: {
  params: { id: string };
}) {
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: any }>(`/api/attempts/${params.id}`)
      .then((res) => setAttempt(res.data))
      .catch((err) => console.error("결과 조회 실패:", err))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-8">결과 불러오는 중...</div>;
  if (!attempt)
    return <div className="p-8 text-red-600">결과를 불러올 수 없습니다.</div>;

  const totalScore = attempt.totalScore || 0;
  const questionList: QuestionResult[] = attempt.questions || [];

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">시험 결과</h1>

      <div className="border rounded-lg bg-white p-4 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-lg font-semibold">{attempt.examTitle || "시험"}</p>
          <p className="text-gray-500 text-sm">
            응시 ID: {attempt.id} | 제출일:{" "}
            {new Date(attempt.submittedAt).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600">총점 {totalScore}점</p>
        </div>
      </div>

      <ul className="space-y-4">
        {questionList.map((q: QuestionResult, i: number) => (
          <li key={q.id} className="border rounded-lg bg-white p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">
                Q{i + 1}. {q.text}
              </h2>
              {q.isCorrect === true && (
                <span className="text-green-600 font-medium">정답 ✅</span>
              )}
              {q.isCorrect === false && (
                <span className="text-red-600 font-medium">오답 ❌</span>
              )}
              {q.isCorrect === null && (
                <span className="text-gray-400 font-medium">채점 대기 ⏳</span>
              )}
            </div>

            {/* 객관식 */}
            {q.type === "MCQ" && (
              <ul className="space-y-1 mb-3">
                {JSON.parse(q.choices || "[]").map(
                  (choice: string, idx: number) => {
                    const isSelected = q.selectedChoices === choice;
                    return (
                      <li
                        key={idx}
                        className={`border rounded p-2 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        {choice}
                      </li>
                    );
                  }
                )}
              </ul>
            )}

            {/* 주관식 */}
            {q.type === "SUBJECTIVE" && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">내 답변:</p>
                <p className="border rounded p-2 bg-gray-50">
                  {q.responseText || "(미작성)"}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              배점 {q.score}점 | 획득점수 {q.scoreAwarded ?? 0}점
            </p>
          </li>
        ))}
      </ul>

      <div className="text-center mt-8">
        <a href="/" className="btn-primary">
          홈으로 돌아가기
        </a>
      </div>
    </main>
  );
}
