"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Page } from "@/lib/api";
import { BookCheck, Calendar } from "lucide-react";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";

interface AttemptHistory {
  attemptId: number;
  examTitle: string;
  submissionDate: string;
  finalScore: number | null;
  status: string;
}

export default function MyHistoryPage() {
  const [historyPage, setHistoryPage] = useState<Page<AttemptHistory> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    api<Page<AttemptHistory>>(`/api/attempts/history?page=${page}`)
      .then((res) => {
        setHistoryPage(res);
      })
      .catch((err) => {
        console.error("Failed to fetch attempt history:", err);
        toast.error("응시 이력을 불러오는 데 실패했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const history = historyPage?.content || [];

  if (loading && history.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">나의 응시 이력</h1>
        <div className="text-center text-gray-500 py-10">
            <p>응시 이력을 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">나의 응시 이력</h1>
      
      {history.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600">아직 응시한 시험이 없습니다.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline font-semibold">
            시험 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {history.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {attempt.examTitle}
                  </h2>
                  {attempt.finalScore !== null ? (
                    <span
                      className={`font-bold text-lg ${
                        attempt.finalScore >= 60 ? "text-blue-600" : "text-red-500"
                      }`}
                    >
                      {attempt.finalScore}점
                    </span>
                  ) : (
                    <span className="font-bold text-lg text-gray-400">-</span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(attempt.submissionDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookCheck className="w-4 h-4" />
                    <span className={`font-semibold ${attempt.status === 'GRADED' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {attempt.status === 'GRADED' ? '채점 완료' : '진행중'}
                    </span>
                  </div>
                </div>
                {attempt.status === 'GRADED' && (
                   <Link
                      href={`/attempts/${attempt.attemptId}/result`}
                      className="inline-block bg-gray-100 text-gray-700 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors"
                   >
                      결과 보기
                   </Link>
                )}
              </div>
            ))}
          </div>
          <Pagination
            page={historyPage?.number || 0}
            totalPages={historyPage?.totalPages || 0}
            setPage={setPage}
          />
        </>
      )}
    </main>
  );
}
