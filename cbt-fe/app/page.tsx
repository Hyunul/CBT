"use client";
import { useEffect, useState } from "react";
import { getExamList, Exam } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Hash, ChevronsUpDown } from "lucide-react";
import toast from "react-hot-toast";

export default function ExamListPage() {
  const [popularExams, setPopularExams] = useState<Exam[]>([]);
  const [otherExams, setOtherExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getExamList()
      .then((data) => {
        setPopularExams(data.popularExams);
        setOtherExams(data.otherExams);
      })
      .catch((err) => {
        console.error("시험 목록 불러오기 실패:", err);
        toast.error("시험 목록을 불러오는 데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const examId = event.target.value;
    if (examId) {
      router.push(`/exam/${examId}`);
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">가장 인기있는 시험 TOP 10</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : popularExams.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-lg">
          <p className="text-lg text-muted-foreground">
            현재 응시 가능한 시험이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-card border rounded-xl p-6 flex flex-col justify-between shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300"
            >
              <div>
                <h2 className="font-bold text-xl text-card-foreground mb-3">
                  {exam.title}
                </h2>
                <div className="flex items-center text-sm text-muted-foreground space-x-4">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4" />
                    <span>{exam.questionCount || "N/A"} 문항</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{exam.durationSec / 60}분</span>
                  </div>
                </div>
              </div>
              <Link
                href={`/exam/${exam.id}`}
                className="btn-primary mt-6 w-full text-center group"
              >
                시험 응시
                <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {otherExams.length > 0 && (
        <div className="mt-16">
          <div className="relative w-full sm:w-80">
            <select
              onChange={handleSelectChange}
              defaultValue=""
              className="input appearance-none w-full pr-10"
            >
              <option value="" disabled>
                다른 시험 선택하기...
              </option>
              {otherExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
