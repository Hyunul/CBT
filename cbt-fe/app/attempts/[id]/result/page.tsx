"use client";

import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Target,
  XCircle,
} from "lucide-react";

// === 타입 정의 ===
interface ReviewItem {
  questionId: number;
  questionText: string;
  type: "MCQ" | "SUBJECTIVE";
  choices: string | null;
  selectedChoices: string | null;
  responseText: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  explanation: string;
}

type ReviewFilter = "all" | "incorrect" | "unanswered";

const hasAnswer = (item: ReviewItem) =>
  Boolean((item.type === "MCQ" ? item.selectedChoices : item.responseText)?.trim());

const reviewStatus = (item: ReviewItem) =>
  !hasAnswer(item) ? "미응답" : item.isCorrect ? "정답" : "오답";

// === 컴포넌트 ===

const ScoreCircle = ({ score, total }: { score: number; total: number }) => {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;

  let strokeColor = "stroke-destructive";
  if (percentage >= 80) strokeColor = "stroke-primary";
  else if (percentage >= 50) strokeColor = "stroke-yellow-500";

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-secondary"
          strokeWidth="10"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
        />
        <circle
          className={`stroke-current ${strokeColor} transition-all duration-1000 ease-in-out`}
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-sm text-muted-foreground">/ {total}</span>
      </div>
    </div>
  );
};

function ReviewCard({ item, index }: { item: ReviewItem; index: number }) {
  let choices: Record<string, string> = {};
  if (item.type === "MCQ" && item.choices) {
    try {
      choices = JSON.parse(item.choices);
    } catch {
      /* Preserve the stored key for legacy invalid data. */
    }
  }
  const answerLabel = (value: string | null) =>
    value && choices[value] ? `${value}번: ${choices[value]}` : value;
  const userAnswer =
    item.type === "MCQ" ? answerLabel(item.selectedChoices) : item.responseText;

  return (
    <div className="min-w-0 bg-card border rounded-xl overflow-hidden shadow-xs">
      <div
        className={`p-4 border-b ${
          item.isCorrect ? "bg-primary/5" : "bg-destructive/5"
        }`}
      >
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex justify-start">
            <div
              className={`flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-full ${
                item.isCorrect
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {item.isCorrect ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {reviewStatus(item)} (+
              {item.isCorrect ? item.score : 0}점)
            </div>
          </div>
          <div className="min-w-0 mt-2">
            <h3
              id={`review-question-${item.questionId}`}
              tabIndex={-1}
              style={{ scrollMarginTop: "calc(var(--navbar-height) + 1rem)" }}
              className="text-lg font-bold text-card-foreground mb-2"
            >
              문제 {index + 1}
            </h3>
            <div className="min-w-0 wrap-break-word text-card-foreground text-base whitespace-pre-wrap leading-relaxed">
              {item.questionText}
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Target className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 wrap-break-word">
            <p className="font-semibold text-muted-foreground">답안</p>
            <p className="wrap-break-word whitespace-pre-wrap font-bold text-lg">
              {hasAnswer(item) ? userAnswer : (
                <span className="text-muted-foreground/70">미응답</span>
              )}
            </p>
          </div>
        </div>
        {!item.isCorrect && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 wrap-break-word">
              <p className="font-semibold text-primary">정답</p>
              <p className="wrap-break-word whitespace-pre-wrap font-bold text-lg text-primary">
                {item.type === "MCQ"
                  ? answerLabel(item.correctAnswer)
                  : item.correctAnswer}
              </p>
            </div>
          </div>
        )}
        {item.explanation && (
          <details className="min-w-0 pt-4 border-t">
            <summary className="cursor-pointer rounded-sm font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
              해설 <span className="sr-only">(문제 {index + 1})</span>
            </summary>
            <p className="mt-3 wrap-break-word text-muted-foreground whitespace-pre-wrap">
              {item.explanation}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}

// === 메인 페이지 컴포넌트 ===
export default function AttemptResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reviewList, setReviewList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  useEffect(() => {
    if (!id) return;
    let active = true;
    api<ReviewItem[]>(`/api/attempts/${id}/result`)
      .then((data) => { if (active) setReviewList(data); })
      .catch((err) => {
        console.error("결과 로드 실패:", err);
        if (active) setError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);

  const retryLoad = () => {
    setError(false);
    setLoading(true);
    setRetry((value) => value + 1);
  };

  const { totalMaxScore, totalEarnedScore, correctCount } = useMemo(() => {
    const totalMaxScore = reviewList.reduce((sum, item) => sum + item.score, 0);
    const totalEarnedScore = reviewList.reduce(
      (sum, item) => sum + (item.isCorrect ? item.score : 0),
      0,
    );
    const correctCount = reviewList.filter((item) => item.isCorrect).length;
    return { totalMaxScore, totalEarnedScore, correctCount };
  }, [reviewList]);

  const unansweredCount = reviewList.filter((item) => !hasAnswer(item)).length;
  const incorrectCount = reviewList.filter((item) => hasAnswer(item) && !item.isCorrect).length;
  const filteredItems = reviewList
    .map((item, index) => ({ item, index }))
    .filter(({ item }) =>
      filter === "all" || (filter === "unanswered" ? !hasAnswer(item) : hasAnswer(item) && !item.isCorrect),
    );
  const filters: { value: ReviewFilter; label: string; count: number }[] = [
    { value: "all", label: "전체", count: reviewList.length },
    { value: "incorrect", label: "오답", count: incorrectCount },
    { value: "unanswered", label: "미응답", count: unansweredCount },
  ];

  if (loading)
    return (
      <div role="status" aria-label="결과를 불러오는 중입니다" className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  if (error)
    return (
      <div role="alert" className="text-center py-20">
        <p className="text-destructive">시험 결과를 불러오지 못했습니다.</p>
        <p className="mt-2 text-muted-foreground">연결을 확인하고 다시 시도해주세요.</p>
        <button className="btn mt-4" onClick={retryLoad}>다시 시도</button>
      </div>
    );
  if (reviewList.length === 0)
    return (
      <div className="text-center py-20">
        <p>결과 데이터가 없습니다.</p>
      </div>
    );

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">시험 결과</h1>
        <button
          onClick={() => router.push("/")}
          className="btn flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> 목록으로
        </button>
      </div>

      <div className="bg-card border rounded-xl shadow-lg p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
          <div className="md:col-span-1 flex justify-center">
            <ScoreCircle score={totalEarnedScore} total={totalMaxScore} />
          </div>
          <div className="md:col-span-2 grid grid-cols-3 gap-2 sm:gap-6 text-center">
            <div className="min-w-0 bg-secondary p-2 sm:p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">정답</p>
              <p className="text-3xl font-bold text-primary">{correctCount}</p>
            </div>
            <div className="min-w-0 bg-secondary p-2 sm:p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">오답</p>
              <p className="text-3xl font-bold text-destructive">
                {incorrectCount}
              </p>
            </div>
            <div className="min-w-0 bg-secondary p-2 sm:p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">미응답</p>
              <p className="text-3xl font-bold">{unansweredCount}</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">문제별 복습</h2>
      <div role="group" aria-label="복습 문항 필터" className="flex flex-wrap gap-2 mb-4">
        {filters.map(({ value, label, count }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`${filter === value ? "btn-primary" : "btn"} focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2`}
          >
            {label} ({count})
          </button>
        ))}
      </div>
      <p role="status" className="text-sm text-muted-foreground mb-4">
        {filters.find(({ value }) => value === filter)?.label} 문항 {filteredItems.length}개
      </p>
      {filteredItems.length > 0 ? (
        <nav aria-label="문항 번호 바로가기" className="flex flex-wrap gap-2 mb-6">
          {filteredItems.map(({ item, index }) => (
            <a
              key={item.questionId}
              href={`#review-question-${item.questionId}`}
              aria-label={`문제 ${index + 1}, ${reviewStatus(item)}`}
              onClick={() => document.getElementById(`review-question-${item.questionId}`)?.focus()}
              className="btn min-w-11 min-h-11 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            >
              {index + 1}
            </a>
          ))}
        </nav>
      ) : (
        <p className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
          {filter === "incorrect" ? "오답 문항이 없습니다." : "미응답 문항이 없습니다."}
        </p>
      )}
      <div className="space-y-6">
        {filteredItems.map(({ item, index }) => (
          <ReviewCard key={item.questionId} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
