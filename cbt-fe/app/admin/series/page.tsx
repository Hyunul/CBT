"use client";
import { errorMessage, ApiError } from "@/lib/api";

import { useEffect, useState } from "react";
import {
  createSeries,
  deleteSeries,
  getSeriesList,
  updateSeries,
  ExamSeries,
} from "@/lib/api";
import toast from "react-hot-toast";

export default function SeriesManagementPage() {
  const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadSeries = () => {
    getSeriesList()
      .then(setSeriesList)
      .catch((err) => {
        console.error(err);
        toast.error("시리즈 목록을 불러오지 못했습니다.");
      });
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("시리즈 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await createSeries(name, description);
      toast.success("시리즈가 생성되었습니다.");
      setName("");
      setDescription("");
      loadSeries();
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err) || "시리즈 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 시리즈를 삭제하시겠습니까?")) return;

    try {
      await deleteSeries(id);
      toast.success("시리즈가 삭제되었습니다.");
      loadSeries();
    } catch (err) {
      console.error(err);
      if (!(err instanceof ApiError) || err.status !== 409) {
        toast.error(errorMessage(err));
        return;
      }
      if (
        confirm(
          "관련된 시험이 존재하여 삭제할 수 없습니다.\n모든 관련 시험과 기록을 포함하여 강제로 삭제하시겠습니까?",
        )
      ) {
        try {
          await deleteSeries(id, true);
          toast.success("시리즈와 관련 데이터가 모두 삭제되었습니다.");
          loadSeries();
        } catch (forceErr) {
          console.error(forceErr);
          toast.error("강제 삭제 실패: " + errorMessage(forceErr));
        }
      }
    }
  };

  const startEdit = (series: ExamSeries) => {
    setEditingId(series.id);
    setEditName(series.name);
    setEditDescription(series.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    try {
      await updateSeries(id, editName, editDescription);
      toast.success("수정되었습니다.");
      setEditingId(null);
      loadSeries();
    } catch (err) {
      console.error(err);
      toast.error("수정 실패: " + errorMessage(err));
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">시리즈(과목) 관리</h1>

      {/* 생성 폼 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">새 시리즈 추가</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded-sm focus:ring-2 focus:ring-primary outline-hidden"
              placeholder="예: 정보처리기사"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 rounded-sm focus:ring-2 focus:ring-primary outline-hidden"
              placeholder="간단한 설명..."
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "생성 중..." : "추가하기"}
          </button>
        </form>
      </div>

      {/* 목록 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">시리즈 목록</h2>
        {seriesList.length === 0 ? (
          <p className="text-gray-500">등록된 시리즈가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-gray-600 text-sm">
                  <th className="py-2 px-3 w-16">ID</th>
                  <th className="py-2 px-3 w-1/4">이름</th>
                  <th className="py-2 px-3">설명</th>
                  <th className="py-2 px-3 text-right w-40">관리</th>
                </tr>
              </thead>
              <tbody>
                {seriesList.map((series) => (
                  <tr key={series.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3">{series.id}</td>

                    {editingId === series.id ? (
                      // Edit Mode
                      <>
                        <td className="py-3 px-3">
                          <input
                            className="w-full border p-1 rounded-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            className="w-full border p-1 rounded-sm"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleUpdate(series.id)}
                            className="text-green-600 font-bold hover:underline"
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-500 hover:underline"
                          >
                            취소
                          </button>
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="py-3 px-3 font-medium">{series.name}</td>
                        <td className="py-3 px-3 text-gray-500">
                          {series.description}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => startEdit(series)}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(series.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            삭제
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
