"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Globe, Lock } from "lucide-react"; // 아이콘 임포트
import toast from "react-hot-toast";

interface Exam {
  id: number;
  title: string;
  published: boolean;
}

export default function AdminExamList() {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    // 관리자용 '모든 시험' API 호출로 변경
    api<{ data: Exam[] }>("/api/exams/all")
      .then((res) => setExams(res.data))
      .catch((err) => {
        console.error(err)
        toast.error("시험 목록을 불러오는데 실패했습니다. 관리자 권한을 확인해주세요.")
      });
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">시험 관리</h1>
        <Link
          href="/admin/exams/new"
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
        >
          + 새 시험 생성
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        {exams.length > 0 ? (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md hover:border-blue-400 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {exam.published ? (
                  <Globe className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <div>
                  <h2 className="font-semibold text-lg text-gray-800">
                    {exam.title}
                  </h2>
                  <p
                    className={`text-sm font-bold ${
                      exam.published ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {exam.published ? "공개" : "비공개"}
                  </p>
                </div>
              </div>

              <Link
                href={`/admin/exams/edit/${exam.id}`}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-semibold transition"
              >
                편집
              </Link>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-10">
            생성된 시험이 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}