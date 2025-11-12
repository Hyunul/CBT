"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";

interface Answer {
  id: number;
  questionId: number;
  responseText: string;
  scoreAwarded: number;
  isCorrect: boolean | null;
}

export default function GradingPage() {
  const [pending, setPending] = useState<Answer[]>([]);
  const { role } = useAuth();

  // ✅ 관리자만 접근 가능
  useEffect(() => {
    if (role !== "ADMIN") return;
    api<{ data: Answer[] }>("/api/admin/grades/pending")
      .then((res) => setPending(res.data))
      .catch((err) => console.error("채점 목록 불러오기 실패:", err));
  }, [role]);

  const grade = async (answerId: number, correct: boolean, score: number) => {
    await api(`/api/admin/grades/${answerId}`, {
      method: "POST",
      body: JSON.stringify({ isCorrect: correct, score }),
    });
    setPending((prev) => prev.filter((x) => x.id !== answerId));
  };

  if (role !== "ADMIN") {
    return (
      <main className="flex items-center justify-center h-screen">
        <p className="text-gray-500">관리자 전용 페이지입니다.</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">📝 주관식 채점 대기 목록</h1>

      {pending.length === 0 ? (
        <p className="text-gray-500">채점할 답변이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {pending.map((ans) => (
            <li
              key={ans.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <p className="font-medium text-gray-800">
                  문제 ID: {ans.questionId}
                </p>
                <div className="border p-3 rounded bg-gray-50">
                  <p className="text-sm text-gray-600 mb-1">응답 내용</p>
                  <p className="text-gray-800 whitespace-pre-line">
                    {ans.responseText || "(응답 없음)"}
                  </p>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => grade(ans.id, true, ans.scoreAwarded || 5)}
                    className="btn-primary"
                  >
                    정답 처리
                  </button>
                  <button
                    onClick={() => grade(ans.id, false, 0)}
                    className="btn"
                  >
                    오답 처리
                  </button>
                  <button
                    onClick={() =>
                      grade(ans.id, true, (ans.scoreAwarded || 5) / 2)
                    }
                    className="btn"
                  >
                    부분 점수
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
