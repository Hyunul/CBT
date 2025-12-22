"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import QuestionItemEditor from "@/components/QuestionItemEditor";
import { Lock, Globe, Save, Trash2 } from "lucide-react"; 
import toast from "react-hot-toast";

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

        // 1. 문제 목록 로딩 (관리자용: 정답 포함)
        api<{ data: Question[] }>(`/api/exams/${id}/questions/admin`)
            .then((res) => setQuestions(res.data))
            .catch((err) => console.error(err));

        // 2. 시험 상세 정보 로딩 (title, isPublic)
        api<{ data: any }>(`/api/exams/${id}`)
            .then((res) => setExamDetails({
                title: res.data.title,
                isPublic: res.data.isPublished 
            }))
            .catch((err) => console.error(err));
    }, [id]);

    const { title, isPublic } = examDetails;

    // 문제 추가 시 QuestionItemEditor의 로직과 일관되도록 choices 키를 숫자로 수정
    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                text: "",
                type: "MCQ",
                // ⭐ 1, 2 키로 초기화하여 QuestionItemEditor의 로직과 일치시킴
                choices: JSON.stringify({
                    "1": "선택지1",
                    "2": "선택지2",
                }),
                answerKey: "",
                answerKeywords: "",
                score: 5,
                tags: "",
                explanation: "",
            },
        ]);
    };

    const saveQuestions = async () => {
        try {
            await api(`/api/exams/${id}/questions`, {
                method: "PUT",
                body: JSON.stringify({ questions }),
            });
            toast.success("문제 목록이 저장되었습니다.");
        } catch (err: any) {
            console.error("Save failed:", err);
            toast.error("문제 저장에 실패했습니다. 다시 시도해주세요.");
        }
    };

    const saveExamDetails = async () => {
        try {
            await api(`/api/exams/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    title,
                    isPublished: isPublic
                }),
            });
            toast.success("시험 정보가 저장되었습니다.");
        } catch (err: any) {
            console.error("Save failed:", err);
            toast.error("시험 정보 저장에 실패했습니다.");
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
            toast.success(
                `시험이 ${newStatus ? "공개" : "비공개"} 상태로 전환되었습니다.`
            );
        } catch (err: any) {
            console.error("Toggle status failed:", err);
            toast.error("상태 전환에 실패했습니다. 다시 시도해주세요.");
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

            toast.success("시험이 삭제되었습니다.");
            router.push("/admin/exams");
        } catch (err: any) {
            console.error("Delete failed:", err);
            toast.error("시험 삭제에 실패했습니다. 다시 시도해주세요.");
        }
    };

    return (
        <main className="max-w-4xl mx-auto p-8 space-y-10">
            {/* Header / Basic Info Area */}
            <div className="flex flex-col gap-6 pb-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Title Input Area */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                            Exam Title
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                className="w-full text-3xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-300 pb-1"
                                value={title}
                                onChange={(e) => setExamDetails(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="시험 제목을 입력하세요"
                            />
                            <button
                                onClick={saveExamDetails}
                                className="flex-shrink-0 p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition shadow-sm"
                                title="제목 저장"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div className="flex items-center gap-3 pt-2">
                        {/* Status Toggle */}
                        <button
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition duration-200 shadow-sm border ${
                                isPublic
                                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                            onClick={togglePublicStatus}
                        >
                            {isPublic ? (
                                <>
                                    <Globe className="w-4 h-4" />
                                    <span>공개 중</span>
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    <span>비공개</span>
                                </>
                            )}
                        </button>

                        {/* Delete Button */}
                        <button
                            className="flex items-center justify-center w-10 h-10 text-red-500 bg-white border border-gray-200 rounded-full hover:bg-red-50 hover:border-red-200 transition shadow-sm"
                            onClick={deleteExam}
                            title="시험 삭제"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Questions Section */}
            <section className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        문제 목록 <span className="text-gray-400 text-lg font-normal">({questions.length})</span>
                    </h2>
                    <button
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                        onClick={addQuestion}
                    >
                        + 문제 추가
                    </button>
                </div>

                <div className="space-y-6">
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
                    {questions.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-500">등록된 문제가 없습니다. 문제를 추가해주세요.</p>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-6 flex justify-end">
                    <button
                        className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition shadow-lg font-bold text-lg transform hover:-translate-y-1"
                        onClick={saveQuestions}
                    >
                        <Save className="w-5 h-5" />
                        전체 저장
                    </button>
                </div>
            </section>
        </main>
    );
}