"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import ExamHero from "@/components/ExamHero";
import ExamStats from "@/components/ExamStats";
import QuestionPreview from "@/components/QuestionPreview";
import RankingSnippet from "@/components/RankingSnippet";
import RelatedExams from "@/components/RelatedExams";
import ExamFAQ from "@/components/ExamFAQ";

interface ExamDetail {
  id: number;
  title: string;
  description?: string;
  questionCount: number;
  durationSec: number;
  series?: {
    id: number;
    name: string;
  };
}

interface QuestionRes {
  id: number;
  text: string;
}

interface RankDto {
  username: string;
  score: number;
}

interface RelatedExam {
  id: number;
  title: string;
  questionCount?: number;
  durationSec?: number;
}

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [previewItems, setPreviewItems] = useState<QuestionRes[]>([]);
  const [rankingItems, setRankingItems] = useState<RankDto[]>([]);
  const [relatedItems, setRelatedItems] = useState<RelatedExam[]>([]);

  useEffect(() => {
    const examId = Array.isArray(id) ? id[0] : id;
    if (!examId) return;

    setLoading(true);

    const examRequest = api<{ data: ExamDetail }>(`/api/exams/${examId}`);
    const questionRequest = api<{ data: QuestionRes[] }>(
      `/api/exams/${examId}/questions`
    ).catch(() => ({ data: [] }));
    const rankingRequest = api<RankDto[]>(
      `/api/ranking/exam/${examId}?limit=3`
    ).catch(() => []);

    Promise.all([examRequest, questionRequest, rankingRequest])
      .then(([examRes, questionRes, rankRes]) => {
        setExam(examRes.data);
        setPreviewItems((questionRes.data || []).slice(0, 5));
        setRankingItems(Array.isArray(rankRes) ? rankRes : []);
      })
      .catch((err) => {
        console.error("시험 정보 로드 실패:", err);
        toast.error("시험 정보를 불러오는 데 실패했습니다.");
        router.push("/");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!exam?.series?.id) {
      setRelatedItems([]);
      return;
    }

    api<{ data: RelatedExam[] }>(`/api/exams?seriesId=${exam.series.id}`)
      .then((res) => {
        const related = (res.data || []).filter((item) => item.id !== exam.id);
        setRelatedItems(related.slice(0, 4));
      })
      .catch(() => setRelatedItems([]));
  }, [exam?.series?.id, exam?.id]);

  const startExam = async () => {
    const examId = Array.isArray(id) ? id[0] : id;
    if (!examId) return;

    setStarting(true);
    try {
      const attemptId = await api<number>(`/api/attempts/start/${examId}`, {
        method: "POST",
      });
      router.push(`/attempts/${attemptId}`);
    } catch (err) {
      toast.error("시험 시작에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="py-20 text-center">
        <p>시험 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const badges = ["CBT 모의고사", "무료 응시 가능"];
  if (exam.series?.name) {
    badges.unshift(exam.series.name);
  }

  return (
    <div className="container space-y-10 py-10">
      <ExamHero
        title={exam.title}
        description={
          exam.description ||
          "시험 난이도와 출제 경향을 확인하고 바로 시작해보세요."
        }
        badges={badges}
        starting={starting}
        onStart={startExam}
      />

      <ExamStats
        questionCount={exam.questionCount}
        durationSec={exam.durationSec}
      />

      <QuestionPreview items={previewItems} />

      <RankingSnippet
        items={rankingItems.map((item) => ({
          name: item.username,
          score: Math.round(item.score ?? 0),
        }))}
      />

      <RelatedExams items={relatedItems} />

      <ExamFAQ />
    </div>
  );
}