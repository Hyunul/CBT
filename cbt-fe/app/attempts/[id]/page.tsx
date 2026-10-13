"use client";

import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import { api } from "@/lib/api";
import { useDebouncedCallback } from "use-debounce";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
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
  serverTime: string;
  submittedAt: string | null;
  answers: {
    questionId: number;
    selectedChoices: string | null;
    responseText: string | null;
  }[];
}

function answerPayload(attempt: AttemptDetail, answers: Record<number, string>) {
  return attempt.questions.map((q) => ({
    questionId: q.id,
    selectedChoices: q.type === "MCQ" ? (answers[q.id] ?? null) : null,
    responseText: q.type === "SUBJECTIVE" ? (answers[q.id] ?? null) : null,
  }));
}

export default function AttemptPage() {
  const { id: attemptId } = useParams();
  const router = useRouter();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [submitting, setSubmitting] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const answersRef = useRef<Record<number, string>>({});
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const expiredRef = useRef(false);
  const flushing = useRef(false);
  const submitLock = useRef(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const attemptHeaderRef = useRef<HTMLElement>(null);
  const questionChanged = useRef(false);

  useEffect(() => {
    if (questionChanged.current) {
      const heading = questionHeadingRef.current;
      heading?.focus({ preventScroll: true });
      if (heading) {
        const bounds = heading.getBoundingClientRect();
        const headerBottom = attemptHeaderRef.current?.getBoundingClientRect().bottom ?? 0;
        if (bounds.top < headerBottom + 16 || bounds.bottom > window.innerHeight) {
          heading.scrollIntoView({ block: "start" });
        }
      }
      questionChanged.current = false;
    }
  }, [currentQIndex]);

  useEffect(() => {
    const header = attemptHeaderRef.current;
    if (!header) return;
    const updateHeight = () => header.parentElement?.parentElement?.style.setProperty("--attempt-header-height", `${header.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [loading, attempt]);

  useEffect(() => {
    if (timeExpired) confirmDialogRef.current?.close();
  }, [timeExpired]);

  // --- Data Fetching ---
  useEffect(() => {
    if (!attemptId) return;
    api<AttemptDetail>(`/api/attempts/${attemptId}`)
      .then((data) => {
        if (data.submittedAt) {
          router.replace(`/attempts/${attemptId}/result`);
          return;
        }
        const restoredAnswers = Object.fromEntries(
          data.answers.map((a) => [
            a.questionId,
            a.selectedChoices ?? a.responseText ?? "",
          ]),
        );
        answersRef.current = restoredAnswers;
        setAnswers(restoredAnswers);
        expiredRef.current =
          new Date(data.startedAt).getTime() + data.durationSec * 1000 <=
          new Date(data.serverTime ?? new Date().toISOString()).getTime();
        setTimeExpired(expiredRef.current);
        setAttempt(data);
      })
      .catch((err) => {
        console.error("Attempt-Detail-Ladefehler:", err);
        toast.error("시험 정보를 불러오는 데 실패했습니다.");
        router.push("/");
      })
      .finally(() => setLoading(false));
  }, [attemptId, router]);

  // --- Answer Handling & Auto-Save ---
  const saveAnswers = useCallback(
    (payload: ReturnType<typeof answerPayload>, version: number) => {
      if (!attemptId || payload.length === 0 || submitLock.current) return;
      const keepalive = flushing.current;
      // Serialize snapshots so an older request cannot overwrite a newer answer.
      saveQueue.current = saveQueue.current
        .then(async () => {
          await api(`/api/attempts/${attemptId}/answers`, {
            method: "POST",
            body: JSON.stringify(payload),
            keepalive,
          });
          savedRevision.current = version;
          if (version === revision.current) setSaveStatus("saved");
        })
        .catch(() => {
          if (version === revision.current) setSaveStatus("error");
        });
    },
    [attemptId],
  );
  const debouncedSave = useDebouncedCallback(
    saveAnswers,
    500,
    { maxWait: 1500 },
  );

  const handleAnswerChange = useCallback(
    (questionId: number, value: string) => {
      if (!attempt || submitLock.current || expiredRef.current) return;
      const next = { ...answersRef.current, [questionId]: value };
      answersRef.current = next;
      revision.current += 1;
      setAnswers(next);
      setSaveStatus("saving");
      debouncedSave(answerPayload(attempt, next), revision.current);
    },
    [attempt, debouncedSave],
  );

  useEffect(() => {
    flushing.current = false;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (revision.current <= savedRevision.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      flushing.current = true;
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  const retrySave = () => {
    if (!attempt || submitLock.current) return;
    debouncedSave.cancel();
    setSaveStatus("saving");
    saveAnswers(answerPayload(attempt, answersRef.current), revision.current);
  };

  // --- Navigation ---
  const goToQuestion = (index: number) => {
    if (attempt && index !== currentQIndex && index >= 0 && index < attempt.questions.length) {
      questionChanged.current = true;
      setCurrentQIndex(index);
    }
  };

  const submit = useCallback(
    async (automatic: boolean) => {
      if (!attempt || submitLock.current) return;
      submitLock.current = true;
      setSubmitting(true);
      setSubmitError(null);
      debouncedSave.cancel();
      try {
        await saveQueue.current;
        const payload = answerPayload(attempt, answersRef.current);
        await api(`/api/attempts/${attemptId}/submit`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        savedRevision.current = revision.current;
        setSaveStatus("saved");
        toast.success(
          automatic
            ? "시간이 종료되어 저장된 답안을 제출했습니다."
            : "시험을 제출했습니다.",
        );
        router.replace(`/attempts/${attemptId}/result`);
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "제출에 실패했습니다. 다시 시도해주세요.";
        setSubmitError(message);
        toast.error(message);
        submitLock.current = false;
        setSubmitting(false);
        // Submission also sends the latest snapshot. Restore autosave if it failed.
        if (revision.current > savedRevision.current) {
          setSaveStatus("saving");
          saveAnswers(answerPayload(attempt, answersRef.current), revision.current);
        }
      }
    },
    [attempt, attemptId, router, debouncedSave, saveAnswers],
  );
  const handleTimeUp = useCallback(() => {
    expiredRef.current = true;
    setTimeExpired(true);
    void submit(true);
  }, [submit]);
  const submitExam = () => {
    if (submitLock.current || expiredRef.current) return;
    confirmDialogRef.current?.showModal();
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
  if (!currentQuestion)
    return <div className="p-8">등록된 문항이 없습니다.</div>;

  const answeredCount = attempt.questions.filter((q) => answers[q.id]?.trim()).length;
  const unansweredNumbers = attempt.questions.flatMap((q, index) => answers[q.id]?.trim() ? [] : [index + 1]);
  const questionPalette = (
    <div className="grid grid-cols-5 gap-2">
      {attempt.questions.map((q, index) => {
        const answered = Boolean(answers[q.id]?.trim());
        const current = index === currentQIndex;
        return (
          <button
            key={q.id}
            onClick={() => goToQuestion(index)}
            aria-current={current ? "step" : undefined}
            aria-label={`${index + 1}번 문항, ${current ? "현재 문항, " : ""}${answered ? "응답 완료" : "미응답"}`}
            className={`flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold transition-colors
              ${current ? "ring-2 ring-primary ring-offset-2" : ""}
              ${answered ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/50">
      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Header */}
        <header ref={attemptHeaderRef} className="sticky top-[var(--navbar-height)] z-40 flex flex-col gap-2 border-b bg-background px-4 py-3 shadow-xs xl:flex-row xl:items-center xl:justify-between">
          <h1 className="min-w-0 wrap-break-word text-xl font-bold">
            {attempt.examTitle}
          </h1>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-4">
            <div
              role="status"
              className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold"
            >
              {saveStatus === "error" ? (
                <span className="text-destructive">저장 실패</span>
              ) : saveStatus === "saving" ? (
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
              serverTime={attempt.serverTime}
              durationSec={attempt.durationSec}
              onTimeUp={handleTimeUp}
            />
            <button
              className="btn-primary inline-flex shrink-0 items-center whitespace-nowrap"
              onClick={submitExam}
              disabled={submitting || timeExpired}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              시험 제출
            </button>
          </div>
        </header>

        <nav aria-label="모바일 문제 탐색" className="border-b bg-background p-4 lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              현재 {currentQIndex + 1} / 전체 {attempt.questions.length} 문항 · 응답 {answeredCount} · 미응답 {attempt.questions.length - answeredCount}
            </p>
            <button
              className="btn"
              aria-expanded={paletteOpen}
              aria-controls="mobile-question-palette"
              onClick={() => setPaletteOpen((open) => !open)}
            >
              {paletteOpen ? "문제 번호 닫기" : "문제 번호 보기"}
            </button>
          </div>
          <div id="mobile-question-palette" hidden={!paletteOpen} className="mt-4">
            {questionPalette}
          </div>
        </nav>

        {/* Question Area */}
        <section aria-label="시험 문항" className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl">
            {(submitting || timeExpired) && (
              <p role="status" className="mb-3 font-semibold">
                {submitting ? "답안을 제출하는 중입니다. 답안 입력이 잠겼습니다." : "시험 시간이 종료되었습니다. 답안 입력이 잠겼습니다."}
              </p>
            )}
            {submitError && (
              <div role="alert" className="mb-4 rounded-lg border bg-card p-4">
                <p className="font-semibold text-destructive">{timeExpired ? "자동 제출 실패" : "제출 실패"}</p>
                <p className="mt-1">{submitError} 연결을 확인하고 다시 시도해주세요.</p>
                <button
                  className="btn mt-3"
                  disabled={submitting}
                  onClick={() => void submit(timeExpired)}
                >
                  제출 재시도
                </button>
              </div>
            )}
            <fieldset disabled={submitting || timeExpired} className="min-w-0 disabled:opacity-70">
              <legend className="sr-only">답안 입력</legend>
              <QuestionCard
                q={currentQuestion}
                headingRef={questionHeadingRef}
                qNumber={currentQIndex + 1}
                value={answers[currentQuestion.id]}
                onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
              />
            </fieldset>
            {saveStatus === "error" && (
              <div role="alert" className="mt-3 rounded-lg border bg-card p-4">
                <p className="text-destructive">자동 저장에 실패했습니다. 최신 답안이 저장되지 않았습니다.</p>
                <button className="btn mt-3" disabled={submitting} onClick={retrySave}>저장 재시도</button>
              </div>
            )}
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
        </section>
      </div>

      {/* Right Sidebar - Question Palette */}
      <aside className="sticky top-[calc(var(--navbar-height)+var(--attempt-header-height,10rem))] hidden max-h-[calc(100dvh-var(--navbar-height)-var(--attempt-header-height,10rem))] w-64 shrink-0 self-start flex-col overflow-y-auto border-l bg-background p-4 lg:flex">
        <p className="mb-4 text-center font-semibold">
          문제 ({currentQIndex + 1} / {attempt.questions.length})
        </p>
        <p className="mb-4 text-center text-sm">응답 {answeredCount} · 미응답 {attempt.questions.length - answeredCount}</p>
        {questionPalette}
        <div className="mt-auto p-2 text-center text-xs text-muted-foreground">
          <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-destructive/70" />
          답안은 입력 후 자동으로 저장됩니다. 최종 제출을 누르면 시험이 즉시
          종료됩니다.
        </div>
      </aside>
      <dialog ref={confirmDialogRef} aria-labelledby="submit-confirm-title" aria-describedby="submit-confirm-details" className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border bg-card p-6 text-card-foreground shadow-lg backdrop:bg-black/50">
        <h2 id="submit-confirm-title" className="text-xl font-bold">시험 제출 확인</h2>
        <div id="submit-confirm-details" className="mt-4 space-y-3">
          <p>응답 {answeredCount} / 전체 {attempt.questions.length} 문항</p>
          <p className="wrap-break-word">미응답 번호: {unansweredNumbers.length ? unansweredNumbers.join(", ") : "없음"}</p>
          <p className="font-semibold">제출 후에는 답안을 수정할 수 없습니다.</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button autoFocus className="btn" onClick={() => confirmDialogRef.current?.close()}>돌아가서 검토</button>
          <button className="btn-primary" disabled={submitting || timeExpired} onClick={() => {
            confirmDialogRef.current?.close();
            if (!expiredRef.current) void submit(false);
          }}>최종 제출</button>
        </div>
      </dialog>
    </div>
  );
}
