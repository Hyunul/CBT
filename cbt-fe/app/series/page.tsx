"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/store/useAuth";

interface ExamSeries {
  id: number;
  name: string;
  description: string;
}

export default function SeriesListPage() {
  const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const isAdmin = role === "ROLE_ADMIN"; // Simplified check

  useEffect(() => {
    api<{ success: boolean; data: ExamSeries[] }>("/api/series")
      .then((res) => {
        setSeriesList(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">시험 과목 목록</h1>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 과목 추가
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seriesList.map((series) => (
          <Link
            href={`/series/${series.id}`}
            key={series.id}
            className="group block p-6 bg-card border rounded-xl hover:shadow-lg transition-all hover:border-primary/50"
          >
            <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
              {series.name}
            </h2>
            <p className="text-muted-foreground line-clamp-2">
              {series.description || "설명 없음"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
