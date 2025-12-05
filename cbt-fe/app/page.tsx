"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Exam {
  id: number;
  title: string;
  totalScore: number;
  durationSec: number;
}

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    api<{ data: Exam[] }>("/api/exams/published")
      .then((res) => setExams(res.data))
      .catch((err) => console.error("시험 목록 불러오기 실패:", err));
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">공개된 시험 목록</h1>
      {exams.length === 0 ? (
        <p>등록된 시험이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {exams.map((exam) => (
            <li key={exam.id} className="border rounded p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">{exam.title}</h2>
                  <p className="text-gray-500 text-sm">
                    총점: {exam.totalScore}점 · 시간: {exam.durationSec}초
                  </p>
                </div>
                <Link href={`/exam/${exam.id}`} className="btn-primary text-sm">
                  상세보기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
