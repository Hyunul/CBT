"use client";

import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
    ArrowLeft,
    CheckCircle,
    HelpCircle,
    Loader2,
    Target,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

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
    const choicesArray: [string, string][] = useMemo(() => {
        if (item.type === "MCQ" && item.choices) {
            try {
                return Object.entries(
                    JSON.parse(item.choices) as Record<string, string>
                ).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
            } catch (e) {
                console.error("Choices JSON parsing error:", e);
            }
        }
        return [];
    }, [item.choices, item.type]);

    const userAnswer =
        item.type === "MCQ" ? item.selectedChoices : item.responseText;

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div
                className={`p-4 border-b ${
                    item.isCorrect ? "bg-primary/5" : "bg-destructive/5"
                }`}
            >
                <div className="flex flex-col gap-2">
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
                            {item.isCorrect ? "정답" : "오답"} (+
                            {item.isCorrect ? item.score : 0}점)
                        </div>
                    </div>
                    <p className="text-lg font-semibold">
                        Q{index + 1}. {item.questionText}
                    </p>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        <Target className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">
                            나의 답
                        </p>
                        <p className="font-bold text-lg">
                            {userAnswer || (
                                <span className="text-muted-foreground/70">
                                    미응답
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                {!item.isCorrect && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-primary">정답</p>
                            <p className="font-bold text-lg text-primary">
                                {item.correctAnswer}
                            </p>
                        </div>
                    </div>
                )}
                {item.explanation && (
                    <div className="flex items-start gap-3 pt-4 border-t">
                        <div className="flex-shrink-0 mt-1">
                            <HelpCircle className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div>
                            <p className="font-semibold text-accent-foreground">
                                해설
                            </p>
                            <p className="text-muted-foreground whitespace-pre-line">
                                {item.explanation}
                            </p>
                        </div>
                    </div>
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

    useEffect(() => {
        if (!id) return;
        api<ReviewItem[]>(`/api/attempts/${id}/result`)
            .then(setReviewList)
            .catch((err) => {
                console.error("결과 로드 실패:", err);
                toast.error("결과를 불러오는 데 실패했습니다.");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const { totalMaxScore, totalEarnedScore, correctCount } = useMemo(() => {
        const totalMaxScore = reviewList.reduce(
            (sum, item) => sum + item.score,
            0
        );
        const totalEarnedScore = reviewList.reduce(
            (sum, item) => sum + (item.isCorrect ? item.score : 0),
            0
        );
        const correctCount = reviewList.filter((item) => item.isCorrect).length;
        return { totalMaxScore, totalEarnedScore, correctCount };
    }, [reviewList]);

    if (loading)
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
                        <ScoreCircle
                            score={totalEarnedScore}
                            total={totalMaxScore}
                        />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-6 text-center">
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                정답
                            </p>
                            <p className="text-3xl font-bold text-primary">
                                {correctCount}
                            </p>
                        </div>
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                오답
                            </p>
                            <p className="text-3xl font-bold text-destructive">
                                {reviewList.length - correctCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">문제별 상세 리뷰</h2>
            <div className="space-y-6">
                {reviewList.map((item, index) => (
                    <ReviewCard
                        key={item.questionId}
                        item={item}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}
