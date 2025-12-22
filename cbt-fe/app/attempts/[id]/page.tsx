"use client";

import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { useDebouncedCallback } from "use-debounce";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

interface QuestionDetail {
  id: number;
  text: string;
  type: "MCQ" | "SUBJECTIVE";
  choices: string | null;
  score: number;
}

interface AttemptDetail {
  attemptId: number;
  examId: number;
  examTitle: string;
  questions: QuestionDetail[];
  durationSec: number;
  startedAt: string;
}

export default function AttemptPage() {
  const { id: attemptId } = useParams();
  const router = useRouter();
  const { userId } = useAuth();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    if (!attemptId) return;
    api<AttemptDetail>(`/api/attempts/${attemptId}`)
      .then(setAttempt)
      .catch((err) => {
        console.error("Attempt-Detail-Ladefehler:", err);
        toast.error("시험 정보를 불러오는 데 실패했습니다.");
        router.push("/");
      })
      .finally(() => setLoading(false));
  }, [attemptId, router]);

  // --- Answer Handling & Auto-Save ---
  const handleAnswerChange = useCallback(
    (questionId: number, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const debouncedSave = useDebouncedCallback(async (payload) => {
    if (!attemptId || payload.length === 0) return;
    setIsSaving(true);
    try {
      await api(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Fehler beim automatischen Speichern:", error);
    } finally {
      setIsSaving(false);
    }
  }, 2000); // 2초 디바운스

  useEffect(() => {
    if (!attempt || Object.keys(answers).length === 0) return;
    const payload = attempt.questions.map((q) => ({
      questionId: q.id,
      selectedChoices: q.type === "MCQ" ? answers[q.id] ?? null : null,
      responseText: q.type === "SUBJECTIVE" ? answers[q.id] ?? null : null,
      userId: userId,
    }));
    debouncedSave(payload);
  }, [answers, attempt, userId, debouncedSave]);

  // --- Navigation ---
  const goToQuestion = (index: number) => {
    if (attempt && index >= 0 && index < attempt.questions.length) {
      setCurrentQIndex(index);
    }
  };

  const handleTimeUp = useCallback(async () => {
    toast.success("시간이 종료되었습니다. 시험지가 자동으로 제출됩니다.");
    // 마지막 답안 저장 후 제출
    if (attempt) {
      const payload = attempt.questions.map((q) => ({
        questionId: q.id,
        selectedChoices: q.type === "MCQ" ? answers[q.id] ?? null : null,
        responseText: q.type === "SUBJECTIVE" ? answers[q.id] ?? null : null,
        userId: userId,
      }));
      await api(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await api(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      router.push(`/attempts/${attemptId}/result`);
    }
  }, [attempt, answers, attemptId, userId, router]);

  const submitExam = async () => {
    if (!confirm("시험을 정말로 제출하시겠습니까?")) return;
    await handleTimeUp(); // 시간 종료 로직 재활용
  };

  // --- Render ---
  if (loading || !attempt) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const currentQuestion = attempt.questions[currentQIndex];

  return (
    <div className="flex h-screen bg-secondary/50">
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6 shadow-sm">
          <h1 className="text-xl font-bold" style={{ marginLeft: "184px" }}>
            {attempt.examTitle}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm font-semibold">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> 저장됨
                </>
              )}
            </div>
            <Timer
              startTime={attempt.startedAt}
              durationSec={attempt.durationSec}
              onTimeUp={handleTimeUp}
            />
            <button className="btn-primary" onClick={submitExam}>
              <CheckCircle className="mr-2 h-4 w-4" />
              시험 제출
            </button>
          </div>
        </header>

        {/* Question Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl">
            <QuestionCard
              q={currentQuestion}
              qNumber={currentQIndex + 1}
              value={answers[currentQuestion.id]}
              onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
            />
            {/* Prev/Next Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => goToQuestion(currentQIndex - 1)}
                disabled={currentQIndex === 0}
                className="btn flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> 이전
              </button>
              <button
                onClick={() => goToQuestion(currentQIndex + 1)}
                disabled={currentQIndex === attempt.questions.length - 1}
                className="btn flex items-center gap-2 disabled:opacity-50"
              >
                다음 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Right Sidebar - Question Palette */}
      <aside className="hidden w-64 flex-col border-l bg-background p-4 lg:flex">
        <p className="mb-4 text-center font-semibold">
          문제 ({currentQIndex + 1} / {attempt.questions.length})
        </p>
        <div className="grid grid-cols-5 gap-2">
          {attempt.questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(index)}
              className={`flex h-10 w-10 items-center justify-center rounded text-sm font-bold transition-colors
                ${
                  index === currentQIndex
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }
                ${
                  answers[q.id]
                    ? "bg-primary/20 text-primary-foreground"
                    : "bg-secondary"
                }
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="mt-auto p-2 text-center text-xs text-muted-foreground">
          <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-destructive/70" />
          답안은 2초마다 자동으로 저장됩니다. 제출 버튼을 누르면 시험이 즉시
          종료됩니다.
        </div>
      </aside>
    </div>
  );
}
