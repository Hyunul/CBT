"use client";

import { useEffect, useState } from "react";
import { api, ExamSeries } from "@/lib/api";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function HomePage() {
  const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ success: boolean; data: ExamSeries[] }>("/api/series")
      .then((res) => {
        setSeriesList(res.data || []);
      })
      .catch((err) => {
        console.error("데이터 불러오기 실패:", err);
        toast.error("자격증 목록을 불러오는 데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-10 max-w-5xl">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          CBT 모의고사 플랫폼
        </h1>
        <p className="text-xl text-muted-foreground">
          원하시는 자격증 종목을 선택하여 모의고사를 응시하세요.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">자격증 종목 선택</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-8 h-32 animate-pulse" />
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-xl">
          <p className="text-lg text-muted-foreground">
            현재 등록된 자격증 종목이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => (
            <Link
              href={`/series/${series.id}`}
              key={series.id}
              className="group relative overflow-hidden bg-card border rounded-xl p-6 transition-all hover:shadow-lg hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {series.name}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2">
                    {series.description || "설명 없음"}
                  </p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}