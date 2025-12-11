"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Loader2 } from "lucide-react";

interface ExamSeries {
  id: number;
  name: string;
  description: string;
}

interface Exam {
  id: number;
  title: string;
  round: number;
  questionCount: number;
  durationSec: number;
}

export default function SeriesDetailPage() {
  const { id } = useParams();
  const [series, setSeries] = useState<ExamSeries | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    // Fetch Series Info
    const fetchSeries = api<{ success: boolean; data: ExamSeries }>(
      `/api/series/${id}`
    );
    
    // Fetch Exams in Series (Assuming endpoint exists or filtering)
    // For now, let's assume we have an endpoint or filter on client
    // Ideally: /api/series/{id}/exams
    const fetchExams = api<{ success: boolean; data: Exam[] }>(
        `/api/exams?seriesId=${id}` 
      ).catch(() => ({ data: [] })); // Graceful fallback if endpoint not ready

    Promise.all([fetchSeries, fetchExams])
      .then(([seriesRes, examsRes]) => {
        setSeries(seriesRes.data);
        setExams(examsRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!series) return <div>Not Found</div>;

  return (
    <div className="container py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-4">{series.name}</h1>
        <p className="text-lg text-muted-foreground">{series.description}</p>
      </div>

      <h2 className="text-2xl font-bold mb-6">회차 목록</h2>
      <div className="grid gap-4">
        {exams.length === 0 ? (
          <p className="text-muted-foreground">등록된 회차가 없습니다.</p>
        ) : (
          exams.map((exam) => (
            <Link
              href={`/exam/${exam.id}`}
              key={exam.id}
              className="group flex items-center justify-between p-6 bg-card border rounded-lg hover:border-primary transition-all"
            >
              <div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                  {exam.round ? `${exam.round}회차: ` : ""} {exam.title}
                </h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {exam.questionCount}문항
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {exam.durationSec / 60}분
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
