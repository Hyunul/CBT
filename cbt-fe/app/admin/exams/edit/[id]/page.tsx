"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, Exam, errorMessage, type ExamType } from "@/lib/api";
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
  type: ExamType;
  isPublic: boolean;
  durationSec: number;
  seriesId: number | null;
  round: number | null;
}

export default function ExamEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  // ⭐ 시험 상세 정보를 관리하는 상태 추가 (title, isPublic)
  const [examDetails, setExamDetails] = useState<ExamDetails>({
    title: "",
    type: "WRITTEN",
    isPublic: false,
    durationSec: 600,
    seriesId: null,
    round: null,
  });

  // 문제 및 시험 정보 로딩
  useEffect(() => {
    if (!id) return;

    // 1. 문제 목록 로딩 (관리자용: 정답 포함)
    api<{ data: Question[] }>(`/api/exams/${id}/questions/admin`)
      .then((res) => setQuestions(res.data))
      .catch((err) => console.error(err));

    // 2. 시험 상세 정보 로딩 (title, isPublic)
    api<{ data: Exam }>(`/api/exams/${id}`)
      .then((res) =>
        setExamDetails({
          title: res.data.title,
          type: res.data.type ?? "WRITTEN",
          isPublic: res.data.isPublished,
          durationSec: res.data.durationSec,
          seriesId: res.data.series?.id ?? null,
          round: res.data.round ?? null,
        }),
      )
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
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(errorMessage(err));
    }
  };

  const saveExamDetails = async () => {
    try {
      await api(`/api/exams/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          type: examDetails.type,
          durationSec: examDetails.durationSec,
          seriesId: examDetails.seriesId,
          round: examDetails.round,
          isPublished: isPublic,
        }),
      });
      toast.success("시험 정보가 저장되었습니다.");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(errorMessage(err));
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
        `시험이 ${newStatus ? "공개" : "비공개"} 상태로 전환되었습니다.`,
      );
    } catch (err) {
      console.error("Toggle status failed:", err);
      toast.error(errorMessage(err));
    }
  };

  const deleteExam = async () => {
    // ⚠️ confirm 대신 커스텀 모달 사용 권장
    if (!confirm("정말 시험을 삭제하시겠습니까? 복구할 수 없습니다.")) return;

    try {
      await api(`/api/exams/${id}`, {
        method: "DELETE",
      });

      toast.success("시험이 삭제되었습니다.");
      router.push("/admin/exams");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(errorMessage(err));
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
              시험 제목
            </label>
            <div className="flex items-center gap-3">
              <input
                className="w-full text-3xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-primary focus:outline-hidden transition-all placeholder-gray-300 pb-1"
                value={title}
                onChange={(e) =>
                  setExamDetails((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="시험 제목을 입력하세요"
              />
              <button
                onClick={saveExamDetails}
                className="btn-primary shrink-0 p-2"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition duration-200 shadow-xs border ${
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
              className="flex items-center justify-center w-10 h-10 text-red-500 bg-white border border-gray-200 rounded-full hover:bg-red-50 hover:border-red-200 transition shadow-xs"
              onClick={deleteExam}
              title="시험 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-lg border bg-card p-6">
        <div>
          <label htmlFor="exam-type" className="mb-1 block font-semibold">시험 유형</label>
          <select
            id="exam-type"
            className="w-full border p-2 rounded-sm"
            value={examDetails.type}
            onChange={(e) => setExamDetails((prev) => ({ ...prev, type: e.target.value as ExamType }))}
          >
            <option value="WRITTEN">필기</option>
            <option value="PRACTICAL">실기</option>
          </select>
        </div>
        <div>
          <label htmlFor="exam-duration" className="mb-1 block font-semibold">시험 시간(초)</label>
          <input
            id="exam-duration"
            type="number"
            className="w-full border p-2 rounded-sm"
            value={examDetails.durationSec}
            aria-describedby={examDetails.type === "PRACTICAL" ? "exam-duration-help" : undefined}
            onChange={(e) => setExamDetails((prev) => ({ ...prev, durationSec: Number(e.target.value) }))}
          />
          {examDetails.type === "PRACTICAL" && (
            <p id="exam-duration-help" className="mt-1 text-xs text-muted-foreground">실기 학습에는 제한 시간이 적용되지 않습니다. 이 값은 시험 정보 저장에 필요합니다.</p>
          )}
        </div>
        <button className="btn-primary" onClick={saveExamDetails}>시험 정보 저장</button>
      </section>

      {/* Questions Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            문제 목록{" "}
            <span className="text-gray-400 text-lg font-normal">
              ({questions.length})
            </span>
          </h2>
          <button
            className="btn-primary flex items-center font-medium"
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
              onChange={(updated: Question) =>
                setQuestions((prev) =>
                  prev.map((item, i) => (i === idx ? updated : item)),
                )
              }
              onDelete={() =>
                setQuestions((prev) => prev.filter((_, i) => i !== idx))
              }
            />
          ))}
          {questions.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">
                등록된 문제가 없습니다. 문제를 추가해주세요.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-6 flex justify-end">
          <button
            className="btn-primary flex items-center gap-2 px-8 py-3 font-bold text-lg"
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
