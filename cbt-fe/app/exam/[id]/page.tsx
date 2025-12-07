"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Clock, Hash, Loader2, PlayCircle } from "lucide-react";

interface ExamDetail {
  id: number;
  title: string;
  questionCount: number;
  durationSec: number;
}

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const examId = Array.isArray(id) ? id[0] : id;
    if (!examId) return;

    api<{ data: ExamDetail }>(`/api/exams/${examId}`)
      .then((res) => {
        setExam(res.data);
      })
      .catch((err) => {
        console.error("시험 정보 로드 실패:", err);
        alert("시험 정보를 불러오는 데 실패했습니다.");
        router.push("/"); // 홈으로 리디렉션
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const startExam = async () => {
    const examId = Array.isArray(id) ? id[0] : id;
    if (!examId) return;

    setStarting(true);
    try {
      // attemptId는 number 타입으로 직접 반환됨
      const attemptId = await api<number>(
        `/api/attempts/start/${examId}`,
        { method: "POST" }
      );
      router.push(`/attempts/${attemptId}`);
    } catch (err) {
      alert("시험 시작에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <p>시험 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container py-10 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-card border rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">{exam.title}</h1>
        <p className="text-muted-foreground mb-8">
          시험을 시작할 준비가 되셨나요? 아래 정보를 확인하세요.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left bg-secondary p-6 rounded-lg mb-10">
          <div className="flex items-center gap-3">
            <Hash className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">총 문항</p>
              <p className="text-xl font-semibold">{exam.questionCount}개</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">제한 시간</p>
              <p className="text-xl font-semibold">{exam.durationSec / 60}분</p>
            </div>
          </div>
        </div>

        <button
          className="btn-primary w-full max-w-xs mx-auto py-3 text-lg font-bold flex items-center justify-center gap-2"
          onClick={startExam}
          disabled={starting}
        >
          {starting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              시작 중...
            </>
          ) : (
            <>
              <PlayCircle className="w-6 h-6" />
              시험 시작
            </>
          )}
        </button>
      </div>
    </div>
  );
}