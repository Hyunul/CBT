"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import QuestionItemEditor from "@/components/QuestionItemEditor";

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

export default function ExamEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");

  // 문제 로딩
  useEffect(() => {
    if (!id) return;

    api<{ data: Question[] }>(`/api/exams/${id}/questions`)
      .then((res) => setQuestions(res.data))
      .catch((err) => console.error(err));

    api<{ data: any }>(`/api/exams/${id}`)
      .then((res) => setTitle(res.data.title))
      .catch((err) => console.error(err));
  }, [id]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        text: "",
        type: "MCQ",
        choices: JSON.stringify({
          "1": "선택지1",
          "2": "선택지2",
        }),
        answerKey: "",
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
      alert("저장되었습니다.");
    } catch (err: any) {
      alert(err.message || "저장 실패");
    }
  };

  const deleteExam = async () => {
    if (!confirm("정말 시험을 삭제하시겠습니까? 복구할 수 없습니다.")) return;

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
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">{title} - 문제 편집</h1>

        {/* 시험 삭제 버튼 */}
        <button
          className="text-red-600 hover:text-red-800 text-sm"
          onClick={deleteExam}
        >
          🗑 시험 삭제
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

      <div className="flex gap-4">
        <button className="btn" onClick={addQuestion}>
          + 문제 추가
        </button>
        <button className="btn-primary" onClick={saveAll}>
          저장하기(임시저장)
        </button>
      </div>
    </main>
  );
}
