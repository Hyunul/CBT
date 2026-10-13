"use client";

import { useAuth } from "@/store/useAuth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Page } from "@/lib/api";
import { BookCheck, Calendar } from "lucide-react";
import Pagination from "@/components/Pagination";

interface AttemptHistory {
  attemptId: number;
  examTitle: string;
  submissionDate: string;
  finalScore: number | null;
  status: "GRADED" | "IN_PROGRESS" | "EXPIRED";
}

export default function MyHistoryPage() {
  const { token, isLoaded } = useAuth();
  const [historyPage, setHistoryPage] = useState<Page<AttemptHistory> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!token || !isLoaded) return;
    let active = true;
    api<Page<AttemptHistory>>(`/api/attempts/history?page=${page}`)
      .then((res) => {
        if (active) setHistoryPage(res);
      })
      .catch((err) => {
        console.error("Failed to fetch attempt history:", err);
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, token, isLoaded, retry]);

  const retryLoad = () => {
    setError(false);
    setLoading(true);
    setRetry((value) => value + 1);
  };

  if (isLoaded && !token)
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">나의 응시 이력</h1>
        <div className="text-center px-4 py-16 bg-card border rounded-lg">
          <p className="text-muted-foreground">로그인이 필요합니다.</p>
          <Link href="/login?returnTo=%2Fmy-history" className="btn-primary mt-4 inline-flex">
            로그인하기
          </Link>
        </div>
      </main>
    );

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

  if (!isLoaded || loading) {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          나의 응시 이력
        </h1>
        <div role="status" className="text-center text-muted-foreground py-10">
          <p>응시 이력을 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">나의 응시 이력</h1>

      {error ? (
        <div role="alert" className="text-center py-16 bg-card border rounded-lg">
          <p className="text-destructive">응시 이력을 불러오지 못했습니다.</p>
          <p className="mt-2 text-muted-foreground">연결을 확인하고 다시 시도해주세요.</p>
          <button className="btn mt-4" onClick={retryLoad}>다시 시도</button>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600">아직 응시한 시험이 없습니다.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline font-semibold"
          >
            시험 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {history.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="border border-gray-200 rounded-lg p-5 bg-white shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap justify-between items-start gap-x-4 gap-y-2 mb-2">
                  <h2 className="min-w-0 flex-1 basis-48 text-xl font-semibold text-gray-800">
                    {attempt.examTitle}
                  </h2>
                  {attempt.status === "GRADED" && attempt.finalScore !== null ? (
                    <span
                      className={`shrink-0 whitespace-nowrap font-bold text-lg ${
                        attempt.finalScore >= 60
                          ? "text-blue-600"
                          : "text-red-500"
                      }`}
                    >
                      {attempt.finalScore}점
                    </span>
                  ) : (
                    <span className="shrink-0 whitespace-nowrap font-bold text-lg text-gray-400">-</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-4">
                  <div className="min-w-0 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{formatDate(attempt.submissionDate)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <BookCheck className="w-4 h-4" />
                    <span
                      className={`whitespace-nowrap font-semibold ${attempt.status === "GRADED" ? "text-green-600" : "text-yellow-600"}`}
                    >
                      {attempt.status === "GRADED" ? "채점 완료" : attempt.status === "EXPIRED" ? "시간 종료" : "진행중"}
                    </span>
                  </div>
                </div>
                {(attempt.status === "IN_PROGRESS" || attempt.status === "EXPIRED") && (
                  <Link href={`/attempts/${attempt.attemptId}`} className="btn-primary inline-block whitespace-nowrap text-sm font-semibold">
                    {attempt.status === "EXPIRED" ? "제출 완료하기" : "이어서 응시"}
                  </Link>
                )}
                {attempt.status === "GRADED" && (
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
            setPage={(value) => {
              setError(false);
              setLoading(true);
              setPage(value);
            }}
          />
        </>
      )}
    </main>
  );
}
