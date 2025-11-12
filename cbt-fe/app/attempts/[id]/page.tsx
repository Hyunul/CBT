"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import QuestionCard from "@/components/QuestionCard";

interface Question {
  id: number;
  text: string;
  type: string;
  choices?: string;
  score: number;
}

export default function AttemptPage({ params }: { params: { id: string } }) {
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { userId } = useAuth();

  useEffect(() => {
    api<{ data: any }>(`/api/attempts/${params.id}`)
      .then((res) => setAttempt(res.data))
      .catch((err) => console.error(err));
  }, [params.id]);

  const saveAnswers = async () => {
    const payload = Object.entries(answers).map(([qId, value]) => ({
      questionId: Number(qId),
      responseText: value,
      selectedChoices: null,
    }));
    await api(`/api/attempts/${params.id}/answers?userId=${userId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const submitExam = async () => {
    await saveAnswers();
    await api(`/api/attempts/${params.id}/submit?userId=${userId}`, {
      method: "POST",
    });
    alert("제출이 완료되었습니다!");
    window.location.href = "/";
  };

  if (!attempt) return <div className="p-8">시험 정보를 불러오는 중...</div>;

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-bold mb-4">{attempt.questions.length}문제</h1>
      {attempt.questions.map((q: Question) => (
        <QuestionCard
          key={q.id}
          q={q}
          value={answers[q.id]}
          onChange={(v: string) =>
            setAnswers((prev) => ({ ...prev, [q.id]: v }))
          }
        />
      ))}
      <div className="flex gap-3">
        <button onClick={saveAnswers} className="btn">
          임시 저장
        </button>
        <button onClick={submitExam} className="btn-primary">
          제출
        </button>
      </div>
    </main>
  );
}
