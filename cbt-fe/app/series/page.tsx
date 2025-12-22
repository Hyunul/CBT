"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import { useAuth } from "@/store/useAuth";

interface ExamSeries {
  id: number;
  name: string;
  description: string;
}

export default function SeriesListPage() {
  const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { role } = useAuth();
  const isAdmin = role === "ROLE_ADMIN"; // Simplified check

  useEffect(() => {
    api<{ success: boolean; data: ExamSeries[] }>("/api/series")
      .then((res) => {
        setSeriesList(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredSeries = seriesList.filter((series) =>
    series.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (series.description && series.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">시험 과목 목록</h1>
        
        <div className="flex w-full md:w-auto items-center gap-3">
            {/* 검색창 */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="과목 검색..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isAdmin && (
            <Link href="/admin/series" className="btn-primary flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary/90 transition">
                <Plus className="w-4 h-4" /> 과목 관리
            </Link>
            )}
        </div>
      </div>

      {filteredSeries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSeries.map((series) => (
            <Link
                href={`/series/${series.id}`}
                key={series.id}
                className="group block p-6 bg-card border rounded-xl hover:shadow-lg transition-all hover:border-primary/50 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors relative z-10">
                {series.name}
                </h2>
                <p className="text-muted-foreground line-clamp-2 relative z-10 text-sm">
                {series.description || "설명 없음"}
                </p>
            </Link>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
