"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ExamStatsDto {
  examTitle: string;
  avgScore: number;
  count: number;
  minScore: number;
  maxScore: number;
}

export default function AdminStatsPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<ExamStatsDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Role check logic can be reinforced here or in ProtectedRoute
    if (role === "ROLE_ADMIN") {
      loadStats();
    } else {
        // Optional: redirect or just stop loading if role is known but not admin
        // For now, let's allow it to attempt if role is admin.
        // If initial role is null (loading), we wait.
    }
  }, [role]);
  
  // Also load on mount if role is already available (e.g. persisted)
  useEffect(() => {
      if(role === "ROLE_ADMIN") loadStats();
  }, []);


  const loadStats = async () => {
    try {
      // Fetching from the new ELK-backed endpoint
      const res = await api<ExamStatsDto[]>("/api/stats/exams");
      // api wrapper might return the data directly or wrapped in data property depending on implementation.
      // Looking at the previous code: "const res = await api<{ data: ExamStat[] }>..."
      // I'll assume standard Axios-like response or the project's wrapper.
      // Let's verify api.ts.
      // If api returns the body directly:
      setStats(res); 
    } catch (err) {
      console.error("통계 데이터 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">통계 불러오는 중...</div>;
  
  // Simple role check render
  if (role !== "ROLE_ADMIN") {
      return <div className="p-8">접근 권한이 없습니다.</div>;
  }

  if (stats.length === 0)
    return <div className="p-8 text-gray-500">통계 데이터가 없습니다.</div>;

  const labels = stats.map((s) => s.examTitle);
  const avgData = stats.map((s) => s.avgScore);
  const countData = stats.map((s) => s.count);

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">📊 응시 통계 대시보드 (ELK Powered)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              },
              scales: {
                  y: { beginAtZero: true, max: 100 }
              }
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
                  label: "응시 횟수",
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
              scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } }
              }
            }}
          />
        </section>
      </div>

      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📋 시험별 상세 요약</h2>
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
            <thead className="bg-gray-100">
                <tr>
                <th className="border p-2 text-left">시험명</th>
                <th className="border p-2 text-center">응시 횟수</th>
                <th className="border p-2 text-center">평균 점수</th>
                <th className="border p-2 text-center">최고점</th>
                <th className="border p-2 text-center">최저점</th>
                </tr>
            </thead>
            <tbody>
                {stats.map((s, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-2 font-medium">{s.examTitle}</td>
                    <td className="border p-2 text-center">{s.count}</td>
                    <td className="border p-2 text-center">
                    {s.avgScore.toFixed(1)}
                    </td>
                    <td className="border p-2 text-center">{s.maxScore}</td>
                    <td className="border p-2 text-center">{s.minScore}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </section>
    </main>
  );
}