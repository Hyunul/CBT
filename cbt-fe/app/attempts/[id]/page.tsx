"use client";

import QuestionCard from "@/components/QuestionCard";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ⭐ 백엔드 DTO에 맞춘 인터페이스 정의
interface QuestionDetail {
  id: number;
  text: string;
  type: "MCQ" | "SUBJECTIVE";
  choices: string | null;
  score: number;
}

interface AttemptDetailRes {
  attemptId: number;
  examId: number;
  examTitle: string;
  questions: QuestionDetail[];
  // TODO: 여기에 duration, startedAt 등 타이머에 필요한 필드를 추가해야 함.
}

export default function AttemptPage() {
  const { id } = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptDetailRes | null>(null);
  // answers: Record<questionId, answerValue (MCQ: key 'A', 'B' | SUBJECTIVE: text string)>
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { userId } = useAuth(); // 백엔드 AnswerReq에서 userId를 필요로 함

  useEffect(() => {
    const attemptId = Array.isArray(id) ? id[0] : id;
    if (!attemptId) return;

    api<AttemptDetailRes>(`/api/attempts/${attemptId}`)
      .then((res) => {
        setAttempt(res); // Attempt 상세 정보 설정
        // TODO: 기존에 저장된 답이 있다면 answers 상태를 초기화하는 로직 추가 필요
      })
      .catch((err) => console.error("Attempt 상세 정보 로드 실패:", err));
  }, [id]);

  const getAttemptId = () => (Array.isArray(id) ? id[0] : id);

  const saveAnswers = async () => {
    if (!attempt) return;
    const attemptId = getAttemptId();

    // AnswerReq DTO에 맞춘 payload 생성
    const payload = attempt.questions.map((q) => {
      const answerValue = answers[q.id];

      return {
        questionId: q.id,
        // ⭐ 응답 값 매핑 로직 정상화:
        // MCQ 타입이면 answerValue를 selectedChoices에, 아니면 null
        selectedChoices: q.type === "MCQ" ? answerValue ?? null : null,
        // SUBJECTIVE 타입이면 answerValue를 responseText에, 아니면 null
        responseText: q.type === "SUBJECTIVE" ? answerValue ?? null : null,
        userId: userId,
      };
    });

    try {
      await api(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert("답변이 임시 저장되었습니다.");
    } catch (error) {
      console.error("답변 저장 실패:", error);
      alert("답변 저장 실패!");
    }
  };

  const submitExam = async () => {
    if (!attempt) return;
    const attemptId = getAttemptId();

    // 1. 최종 답변 임시 저장
    await saveAnswers();

    try {
      // 2. 시험 제출 및 채점 요청
      await api<{ data: any }>(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });

      // 3. 리뷰 페이지로 이동
      router.push(`/attempts/${attemptId}/result`);
    } catch (error) {
      console.error("시험 제출 실패:", error);
      alert("시험 제출 실패!");
    }
  };

  if (!attempt)
    return (
      <div className="p-8 text-center text-xl">시험 정보를 불러오는 중...</div>
    );

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-800">
          {attempt.examTitle}
        </h1>
        <p className="text-gray-500 mt-1">총 {attempt.questions.length} 문항</p>
      </div>

      {/* 문제 리스트 */}
      <div className="space-y-6">
        {attempt.questions.map((q, index) => (
          <div key={q.id}>
            {/* QuestionCard에 문제 번호를 보여주기 위해 q 객체에 인덱스를 추가하거나 QuestionCard 내부에서 처리할 수 있습니다. */}
            <QuestionCard
              q={q}
              value={answers[q.id]}
              onChange={(v: string) =>
                setAnswers((prev) => ({ ...prev, [q.id]: v }))
              }
            />
          </div>
        ))}
      </div>

      {/* 버튼 영역 */}
      <div className="sticky bottom-0 bg-white border-t pt-4 pb-8 flex justify-end gap-4">
        <button
          onClick={saveAnswers}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-150 shadow-sm"
        >
          답안 임시 저장
        </button>
        <button
          onClick={submitExam}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-150 shadow-lg"
        >
          시험 제출
        </button>
      </div>
    </main>
  );
}
