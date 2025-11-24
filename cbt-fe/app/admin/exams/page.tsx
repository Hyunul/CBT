"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Exam {
  id: number;
  title: string;
  published: boolean;
}

export default function AdminExamList() {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    api<{ data: Exam[] }>("/api/exams/published")
      .then((res) => setExams(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">시험 관리</h1>
        <Link href="/admin/exams/new" className="btn-primary">
          시험 생성
        </Link>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="border rounded p-4 flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold text-lg">{exam.title}</h2>
              <p className="text-gray-500 text-sm">
                상태: {exam.published ? "공개" : "비공개"}
              </p>
            </div>

            <Link
              href={`/admin/exams/edit/${exam.id}`}
              className="text-blue-600 hover:underline"
            >
              문제 편집
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
