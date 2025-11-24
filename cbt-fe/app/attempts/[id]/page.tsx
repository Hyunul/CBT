"use client";

import QuestionCard from "@/components/QuestionCard";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Question {
  id: number;
  text: string;
  type: string;
  choices?: string;
  score: number;
}

export default function AttemptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { userId } = useAuth();

  useEffect(() => {
    if (!id) return;

    api<{ data: any }>(`/api/attempts/${id}`)
      .then((res) => setAttempt(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  const saveAnswers = async () => {
    if (!attempt) return;

    const payload = attempt.questions.map((q: any) => ({
      questionId: q.id,
      selectedChoices: q.type === "MCQ" ? answers[q.id] ?? null : null,
      responseText: q.type === "SUBJECTIVE" ? answers[q.id] ?? null : null,
      userId: userId,
    }));

    await api(`/api/attempts/${id}/answers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const submitExam = async () => {
    await saveAnswers();

    const res = await api<{ data: any }>(`/api/attempts/${id}/submit`, {
      method: "POST",
    });

    router.push(`/attempts/${id}/review`);
  };

  if (!attempt) return <div className="p-8">시험 정보를 불러오는 중...</div>;

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-xl font-bold mb-4">
        {attempt.questions.length} 문제
      </h1>

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
