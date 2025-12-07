"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import QuestionItemEditor from "@/components/QuestionItemEditor";
import { Lock, Globe } from "lucide-react"; // 아이콘 추가

// 문제의 세부 정보 인터페이스
interface Question {
    text: string;
    type: string;
    choices?: string;
    answerKey?: string;
    answerKeywords?: string;
    score: number;
    tags: string;
    explanation: string;
}

// 시험 자체의 세부 정보 인터페이스 (공개 상태 포함)
interface ExamDetails {
    title: string;
    isPublic: boolean;
}

export default function ExamEditPage() {
    const { id } = useParams();
    const router = useRouter();

    const [questions, setQuestions] = useState<Question[]>([]);
    // ⭐ 시험 상세 정보를 관리하는 상태 추가 (title, isPublic)
    const [examDetails, setExamDetails] = useState<ExamDetails>({
        title: "",
        isPublic: false,
    });

    // 문제 및 시험 정보 로딩
    useEffect(() => {
        if (!id) return;

        // 1. 문제 목록 로딩
        api<{ data: Question[] }>(`/api/exams/${id}/questions`)
            .then((res) => setQuestions(res.data))
            .catch((err) => console.error(err));

        // 2. 시험 상세 정보 로딩 (title, isPublic)
        api<{ data: ExamDetails }>(`/api/exams/${id}`)
            .then((res) => setExamDetails(res.data))
            .catch((err) => console.error(err));
    }, [id]);

    const { title, isPublic } = examDetails;

    // 문제 추가 시 QuestionItemEditor의 로직과 일관되도록 choices 키를 알파벳으로 수정
    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                text: "",
                type: "MCQ",
                // ⭐ A, B 키로 초기화하여 QuestionItemEditor의 로직과 일치시킴
                choices: JSON.stringify({
                    A: "선택지1",
                    B: "선택지2",
                }),
                answerKey: "",
                answerKeywords: "",
                score: 5,
                tags: "",
                explanation: "",
            },
        ]);
    };

    const saveAll = async () => {
        try {
            await api(`/api/exams/${id}/questions`, {
                method: "PUT",
                body: JSON.stringify({ questions }),
            });
            alert("문제 목록이 저장되었습니다.");
            // 저장 후 관리자 페이지로 돌아가도록 수정
            router.push(`/admin/exams`);
        } catch (err: any) {
            alert(err.message || "문제 저장 실패");
        }
    };

    // ⭐ 공개/비공개 상태 토글 함수
    const togglePublicStatus = async () => {
        const newStatus = !isPublic;
        const confirmMessage = newStatus
            ? "시험을 공개 상태로 전환하시겠습니까? 모든 사용자가 접근할 수 있습니다."
            : "시험을 비공개 상태로 전환하시겠습니까? 접근이 제한됩니다.";

        // ⚠️ confirm 대신 커스텀 모달 사용 권장
        if (!confirm(confirmMessage)) return;

        try {
            await api(`/api/exams/${id}/publish?on=${newStatus}`, {
                method: "PATCH", // 부분 업데이트를 위해 PATCH 사용
            });

            // UI 상태 업데이트
            setExamDetails((prev) => ({ ...prev, isPublic: newStatus }));
            alert(
                `시험이 ${newStatus ? "공개" : "비공개"} 상태로 전환되었습니다.`
            );
        } catch (err: any) {
            alert(err.message || "상태 전환 실패");
        }
    };

    const deleteExam = async () => {
        // ⚠️ confirm 대신 커스텀 모달 사용 권장
        if (!confirm("정말 시험을 삭제하시겠습니까? 복구할 수 없습니다."))
            return;

        try {
            await api(`/api/exams/${id}`, {
                method: "DELETE",
            });

            alert("시험이 삭제되었습니다.");
            router.push("/admin/exams");
        } catch (err: any) {
            alert(err.message || "삭제 실패");
        }
    };

    return (
        <main className="max-w-3xl mx-auto p-8 space-y-5">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-xl font-bold text-gray-800">
                    {title} - 문제 편집
                </h1>

                {/* ⭐ 공개/비공개 토글 버튼 */}
                <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition duration-200 shadow-md ${
                        isPublic
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-yellow-500 hover:bg-yellow-600 text-white"
                    }`}
                    onClick={togglePublicStatus}
                >
                    {isPublic ? (
                        <>
                            <Globe className="w-4 h-4" />
                            공개 상태
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" />
                            비공개 상태
                        </>
                    )}
                </button>
            </div>

            {questions.map((q, idx) => (
                <QuestionItemEditor
                    key={idx}
                    q={q}
                    index={idx}
                    onChange={(updated: any) =>
                        setQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? updated : item))
                        )
                    }
                    onDelete={() =>
                        setQuestions((prev) => prev.filter((_, i) => i !== idx))
                    }
                />
            ))}

            <div className="flex gap-4 pt-4 border-t">
                <button
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    onClick={addQuestion}
                >
                    + 문제 추가
                </button>
                <button
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    onClick={saveAll}
                >
                    저장하기
                </button>

                {/* 시험 삭제 버튼을 하단에도 추가하여 접근성 향상 */}
                <button
                    className="ml-auto px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition"
                    onClick={deleteExam}
                >
                    🗑 시험 삭제
                </button>
            </div>
        </main>
    );
}
