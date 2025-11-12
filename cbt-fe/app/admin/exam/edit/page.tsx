"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";

interface QuestionInput {
  id?: number;
  text: string;
  type: "MCQ" | "SUBJECTIVE";
  choices: string[];
  score: number;
}

export default function EditExamPage({ params }: { params: { id: string } }) {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [durationSec, setDurationSec] = useState(600);
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [message, setMessage] = useState("");

  // ✅ 관리자만 접근 가능
  if (role !== "ADMIN") {
    return (
      <main className="flex items-center justify-center h-screen">
        <p className="text-gray-500">관리자 전용 페이지입니다.</p>
      </main>
    );
  }

  useEffect(() => {
    const loadExam = async () => {
      try {
        const res = await api<{ data: any }>(`/api/exams/${params.id}`);
        const exam = res.data;
        setTitle(exam.title);
        setDurationSec(exam.durationSec);
        setQuestions(
          exam.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            choices: q.type === "MCQ" ? JSON.parse(q.choices || "[]") : [],
            score: q.score,
          }))
        );
      } catch (err) {
        console.error("시험 불러오기 실패:", err);
        setMessage("시험 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [params.id]);

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQs = [...questions];
    (newQs[index] as any)[field] = value;
    setQuestions(newQs);
  };

  const addChoice = (qIdx: number) => {
    const newQs = [...questions];
    newQs[qIdx].choices.push("");
    setQuestions(newQs);
  };

  const updateChoice = (qIdx: number, cIdx: number, value: string) => {
    const newQs = [...questions];
    newQs[qIdx].choices[cIdx] = value;
    setQuestions(newQs);
  };

  const removeChoice = (qIdx: number, cIdx: number) => {
    const newQs = [...questions];
    newQs[qIdx].choices.splice(cIdx, 1);
    setQuestions(newQs);
  };

  const saveChanges = async () => {
    try {
      const payload = {
        title,
        durationSec,
        totalScore: questions.reduce((sum, q) => sum + q.score, 0),
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          choices: q.type === "MCQ" ? JSON.stringify(q.choices) : null,
          score: q.score,
        })),
      };

      await api(`/api/exams/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMessage("시험이 성공적으로 수정되었습니다!");
    } catch (err: any) {
      setMessage("수정 실패: " + err.message);
    }
  };

  if (loading) return <div className="p-8">시험 정보를 불러오는 중...</div>;

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">✏️ 시험 수정</h1>

      <div className="bg-white border p-4 rounded-lg shadow-sm space-y-3">
        <input
          className="input"
          placeholder="시험 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-4 items-center">
          <label className="text-sm text-gray-600">
            제한 시간(초)
            <input
              type="number"
              className="input mt-1"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
            />
          </label>
          <p className="text-sm text-gray-500 self-end">
            총 {questions.reduce((sum, q) => sum + q.score, 0)}점
          </p>
        </div>
      </div>

      <section>
        <h2 className="font-semibold mb-3">문항 목록</h2>
        {questions.map((q, idx) => (
          <div
            key={q.id || idx}
            className="bg-white border p-4 rounded-lg shadow-sm mb-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">문항 {idx + 1}</h3>
              <select
                className="input w-36"
                value={q.type}
                onChange={(e) => updateQuestion(idx, "type", e.target.value)}
              >
                <option value="MCQ">객관식</option>
                <option value="SUBJECTIVE">주관식</option>
              </select>
            </div>

            <textarea
              className="w-full border rounded p-2"
              rows={2}
              placeholder="문제 내용을 입력하세요"
              value={q.text}
              onChange={(e) => updateQuestion(idx, "text", e.target.value)}
            />

            <label className="text-sm text-gray-600">
              배점:
              <input
                type="number"
                className="input mt-1 w-24 inline-block ml-2"
                value={q.score}
                onChange={(e) =>
                  updateQuestion(idx, "score", Number(e.target.value))
                }
              />
            </label>

            {q.type === "MCQ" && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  선택지
                </h4>
                {q.choices.map((choice, cIdx) => (
                  <div key={cIdx} className="flex gap-2 mb-2">
                    <input
                      className="input flex-1"
                      placeholder={`선택지 ${cIdx + 1}`}
                      value={choice}
                      onChange={(e) => updateChoice(idx, cIdx, e.target.value)}
                    />
                    <button
                      className="btn text-xs"
                      onClick={() => removeChoice(idx, cIdx)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  className="btn-primary text-sm mt-1"
                  onClick={() => addChoice(idx)}
                >
                  + 선택지 추가
                </button>
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="text-center">
        <button className="btn-primary w-40" onClick={saveChanges}>
          수정 내용 저장
        </button>
      </div>

      {message && (
        <p className="text-center text-sm mt-3 text-blue-600">{message}</p>
      )}
    </main>
  );
}
