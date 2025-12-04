"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation"; // useRouter 추가
import { useAuth } from "@/store/useAuth";

export default function ExamDetailPage() {
  // id는 URL 파라미터에서 현재 Exam ID를 나타냄
  const { id } = useParams();
  const router = useRouter(); // 페이지 이동을 위해 useRouter 사용
  const [exam, setExam] = useState<any>(null); // const { userId } = useAuth(); // userId는 이제 백엔드에서 추출하므로 사용하지 않음
  useEffect(() => {
    const examId = Array.isArray(id) ? id[0] : id;
    if (!examId) return; // API 호출: 특정 시험 조회

    api<{ data: any }>(`/api/exams/${examId}`)
      .then((res) => setExam(res.data))
      .catch((err) => console.error("시험 정보 로드 실패:", err));
  }, [id]);

  const startExam = async () => {
    // id는 현재 Exam ID
    const examId = Array.isArray(id) ? id[0] : id;
    if (!examId) return;

    try {
      const attemptId = await api<number>(`/api/attempts/start/${examId}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      router.push(`/attempts/${attemptId}`);
    } catch (err) {
      alert("응시 시작 실패");
      console.error(err);
    }
  };

  if (!exam) return <div className="p-8">로딩 중...</div>;

  return (
    <main className="max-w-2xl mx-auto p-8">
                  <h1 className="text-2xl font-bold mb-3">{exam.title}</h1>     
           {" "}
      <p className="text-gray-600 mb-4">
                        총점: {exam.totalScore}점 | 제한시간: {exam.durationSec}
        초            {" "}
      </p>
                 {" "}
      <button className="btn-primary" onClick={startExam}>
                        시험 시작            {" "}
      </button>
             {" "}
    </main>
  );
}
