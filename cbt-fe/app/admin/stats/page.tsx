"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ExamStat {
  examId: number;
  examTitle: string;
  totalAttempts: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  gradedCount: number;
  totalQuestions: number;
}

export default function AdminStatsPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<ExamStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "ADMIN") return;
    loadStats();
  }, [role]);

  const loadStats = async () => {
    try {
      const res = await api<{ data: ExamStat[] }>("/api/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("통계 데이터 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (role !== "ADMIN") {
    return (
      <main className="flex items-center justify-center h-screen">
        <p className="text-gray-500">관리자 전용 페이지입니다.</p>
      </main>
    );
  }

  if (loading) return <div className="p-8">통계 불러오는 중...</div>;

  if (stats.length === 0)
    return <div className="p-8 text-gray-500">통계 데이터가 없습니다.</div>;

  // ✅ 차트용 데이터 구성
  const labels = stats.map((s) => s.examTitle);
  const avgData = stats.map((s) => s.avgScore);
  const countData = stats.map((s) => s.totalAttempts);
  const gradingRate = stats.map((s) =>
    s.totalAttempts ? Math.round((s.gradedCount / s.totalAttempts) * 100) : 0
  );

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">📊 응시 통계 대시보드</h1>

      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📈 평균 점수 비교</h2>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "평균 점수",
                data: avgData,
                backgroundColor: "rgba(59, 130, 246, 0.6)",
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: "top" },
              title: { display: false },
            },
          }}
        />
      </section>

      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">👥 응시자 수</h2>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "응시자 수",
                data: countData,
                backgroundColor: "rgba(16, 185, 129, 0.6)",
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: "top" },
            },
          }}
        />
      </section>

      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">🧮 채점 완료율</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((s) => (
            <div key={s.examId} className="border p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-700">
                {s.examTitle}
              </h3>
              <Pie
                data={{
                  labels: ["채점 완료", "미채점"],
                  datasets: [
                    {
                      data: [s.gradedCount, s.totalAttempts - s.gradedCount],
                      backgroundColor: [
                        "rgba(59, 130, 246, 0.7)",
                        "rgba(209, 213, 219, 0.7)",
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                  },
                }}
              />
              <p className="text-center text-sm mt-2 text-gray-600">
                {gradingRate[stats.indexOf(s)]}% 완료
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📋 시험별 요약</h2>
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">시험명</th>
              <th className="border p-2">응시자 수</th>
              <th className="border p-2">평균 점수</th>
              <th className="border p-2">최고점</th>
              <th className="border p-2">최저점</th>
              <th className="border p-2">채점 완료율</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.examId} className="hover:bg-gray-50">
                <td className="border p-2">{s.examTitle}</td>
                <td className="border p-2 text-center">{s.totalAttempts}</td>
                <td className="border p-2 text-center">
                  {s.avgScore.toFixed(1)}
                </td>
                <td className="border p-2 text-center">{s.maxScore}</td>
                <td className="border p-2 text-center">{s.minScore}</td>
                <td className="border p-2 text-center">
                  {gradingRate[stats.indexOf(s)]}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
