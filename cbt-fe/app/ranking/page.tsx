"use client";

interface RankDto {
  rank: number;
  userId: number;
  username: string;
  score: number;
}

import { Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, Page, Exam } from "@/lib/api";

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankDto[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRanking, setSelectedRanking] = useState("global");
  const rankingTitle = selectedRanking === "global" ? "글로벌 응시 횟수 랭킹" : exams.find(e=>String(e.id)===selectedRanking)?.title ?? "선택된 시험";

  /** -------------------------------
   *  시험 목록 로딩 (Spring Pageable 대응)
   * ------------------------------- */
  useEffect(() => {
    api<{ data: Page<Exam> }>("/api/exams/published")
      .then((res) => {
        const raw = res.data;

        if (raw && Array.isArray(raw.content)) {
          setExams(raw.content);
        } else {
          console.error("Unexpected exam response:", raw);
          setExams([]);
        }
      })
      .catch(console.error);
  }, []);

  /** -------------------------------
   *  랭킹 로딩 (배열 또는 pageable 둘 다 대응)
   * ------------------------------- */
  useEffect(() => {
    const url = selectedRanking === "global" ? "/api/ranking/global/submissions" : `/api/ranking/exam/${selectedRanking}`;
    let active = true;
    api<RankDto[]>(url)
      .then((res) => {
        if(!active) return;
        // Backend's RankingController directly returns List<RankDto>, not ApiResponse<List<RankDto>>
        // So 'res' itself is the List<RankDto> array.
        // No need for 'res.data'
        const raw = res; // Fix: res is already the array

        // ✔ 배열일 때 (가장 정상적인 케이스)
        if (Array.isArray(raw)) {
          setRankings(raw);
          return;
        }

        // ✔ undefiend 또는 이상한 응답
        console.error("Unexpected ranking response:", raw);
        setRankings([]);
      })
      .catch(console.error)
      .finally(() => {if(active) setLoading(false);});
    return ()=>{active=false;};
  }, [selectedRanking]);

  /** ------------------------------- */
  /** 스타일 함수 */
  /** ------------------------------- */
  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500 bg-yellow-50";
    if (rank === 2) return "text-gray-500 bg-gray-50";
    if (rank === 3) return "text-amber-700 bg-amber-50";
    return "text-gray-500";
  };

  const getScoreLabel = selectedRanking === "global" ? "응시 횟수" : "점수";

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-4">
        <h1 className="min-w-0 text-2xl sm:text-4xl font-extrabold text-gray-900">
          {rankingTitle}
        </h1>

        <div className="w-full sm:w-80 sm:shrink-0">
        <label htmlFor="ranking-filter" className="mb-2 block text-sm font-medium">랭킹 기준</label>
        <select
          id="ranking-filter"
          value={selectedRanking}
          onChange={(e) => {setLoading(true);setSelectedRanking(e.target.value);}}
          className="input w-full p-3 font-medium"
        >
          <option value="global">글로벌 응시 횟수 랭킹</option>

          {exams.map((exam) => (
            <option key={exam.id} value={exam.id.toString()}>
              {exam.title}
            </option>
          ))}
        </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : rankings.length === 0 ? (
          <p className="text-center py-20 text-gray-500 text-xl font-medium">
            현재 표시할 랭킹 데이터가 없습니다.
          </p>
        ) : (
          <table className="w-full text-left table-fixed">
            <thead className="bg-primary/5 border-b border-primary/20">
              <tr>
                <th className="p-2 sm:p-4 w-16 sm:w-24 whitespace-nowrap text-center text-primary font-semibold">
                  순위
                </th>
                <th className="p-2 sm:p-4 text-primary font-semibold">사용자</th>
                <th className="p-2 sm:p-4 w-24 sm:w-32 whitespace-nowrap text-right text-primary font-semibold">
                  {getScoreLabel}
                </th>
              </tr>
            </thead>

            <tbody>
              {rankings.map((user) => (
                <tr
                  key={user.userId}
                  className="border-b last:border-none hover:bg-gray-50 transition"
                >
                  <td className="p-2 sm:p-4 font-bold text-lg text-center">
                    <div
                      className={`flex justify-center items-center gap-1 sm:gap-2 sm:p-2 rounded-lg ${getRankColor(
                        user.rank
                      )}`}
                    >
                      {user.rank <= 3 && (
                        <Crown className="w-4 h-4 shrink-0 sm:w-5 sm:h-5 fill-current" />
                      )}
                      {user.rank}
                    </div>
                  </td>

                  <td className="p-2 sm:p-4 font-semibold text-gray-800">
                    <span className="block truncate" title={user.username}>{user.username}</span>
                  </td>

                  <td className="p-2 sm:p-4 whitespace-nowrap text-right font-mono text-lg sm:text-xl text-gray-900 font-bold">
                    {(user.score ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
