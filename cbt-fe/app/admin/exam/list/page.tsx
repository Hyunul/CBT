"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/useAuth";

interface Exam {
  id: number;
  title: string;
  totalScore: number;
  durationSec: number;
  published: boolean;
  createdAt?: string;
}

export default function ExamListAdminPage() {
  const { role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (role !== "ADMIN") return;
    loadExams();
  }, [role]);

  const loadExams = async () => {
    try {
      const res = await api<{ data: Exam[] }>("/api/exams");
      setExams(res.data);
    } catch (err) {
      console.error("시험 목록 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (examId: number, current: boolean) => {
    try {
      await api(`/api/exams/${examId}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ published: !current }),
      });
      setMessage(`시험 ${examId}의 공개 상태가 변경되었습니다.`);
      loadExams();
    } catch (err: any) {
      setMessage("상태 변경 실패: " + err.message);
    }
  };

  const deleteExam = async (examId: number) => {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    try {
      await api(`/api/exams/${examId}`, { method: "DELETE" });
      setExams((prev) => prev.filter((e) => e.id !== examId));
      setMessage(`시험 ${examId}이 삭제되었습니다.`);
    } catch (err: any) {
      setMessage("삭제 실패: " + err.message);
    }
  };

  if (role !== "ADMIN") {
    return (
      <main className="flex items-center justify-center h-screen">
        <p className="text-gray-500">관리자 전용 페이지입니다.</p>
      </main>
    );
  }

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">📚 시험 목록 관리</h1>

      <div className="mb-6 flex justify-between items-center">
        <a href="/admin/exams/new" className="btn-primary">
          + 새 시험 등록
        </a>
        {message && <p className="text-sm text-blue-600">{message}</p>}
      </div>

      {exams.length === 0 ? (
        <p className="text-gray-500">등록된 시험이 없습니다.</p>
      ) : (
        <table className="w-full border-collapse border text-sm bg-white rounded-lg shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2 text-left">제목</th>
              <th className="border p-2">총점</th>
              <th className="border p-2">시간(초)</th>
              <th className="border p-2">공개여부</th>
              <th className="border p-2">등록일</th>
              <th className="border p-2">관리</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50">
                <td className="border p-2 text-center">{exam.id}</td>
                <td className="border p-2">{exam.title}</td>
                <td className="border p-2 text-center">{exam.totalScore}</td>
                <td className="border p-2 text-center">{exam.durationSec}</td>
                <td className="border p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      exam.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {exam.published ? "공개" : "비공개"}
                  </span>
                </td>
                <td className="border p-2 text-center">
                  {exam.createdAt
                    ? new Date(exam.createdAt).toLocaleDateString("ko-KR")
                    : "-"}
                </td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    className="btn text-xs"
                    onClick={() => togglePublish(exam.id, exam.published)}
                  >
                    {exam.published ? "비공개" : "공개"}
                  </button>
                  <a
                    href={`/admin/exams/edit/${exam.id}`}
                    className="btn-primary text-xs"
                  >
                    수정
                  </a>
                  <button
                    className="btn text-xs text-red-600"
                    onClick={() => deleteExam(exam.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
