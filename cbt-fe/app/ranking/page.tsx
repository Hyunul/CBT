"use client";

import { Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface SeriesRankDto {
  rank: number;
  seriesId: number;
  seriesName: string;
  solvedCount: number;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<SeriesRankDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api<SeriesRankDto[]>("/api/ranking/series?limit=50")
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res)) {
          setRankings(res);
        } else {
          console.error("Unexpected ranking response:", res);
          setRankings([]);
        }
      })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500 bg-yellow-50";
    if (rank === 2) return "text-gray-500 bg-gray-50";
    if (rank === 3) return "text-amber-700 bg-amber-50";
    return "text-gray-500";
  };

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          자격증 종목 랭킹
        </h1>
        <p className="mt-3 text-muted-foreground">
          많이 풀린 자격증 종목 순위입니다.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : rankings.length === 0 ? (
          <p className="text-center py-20 text-gray-500 text-xl font-medium">
            아직 풀이 기록이 없습니다.
          </p>
        ) : (
          <table className="w-full text-left table-fixed">
            <thead className="bg-primary/5 border-b border-primary/20">
              <tr>
                <th scope="col" className="p-2 sm:p-4 w-16 sm:w-24 whitespace-nowrap text-center text-primary font-semibold">
                  순위
                </th>
                <th scope="col" className="p-2 sm:p-4 text-primary font-semibold">
                  자격증 종목
                </th>
                <th scope="col" className="p-2 sm:p-4 w-24 sm:w-32 whitespace-nowrap text-right text-primary font-semibold">
                  풀이 횟수
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((series) => (
                <tr key={series.seriesId} className="border-b last:border-none hover:bg-gray-50 transition">
                  <td className="p-2 sm:p-4 font-bold text-lg text-center">
                    <div className={`flex justify-center items-center gap-1 sm:gap-2 sm:p-2 rounded-lg ${getRankColor(series.rank)}`}>
                      {series.rank <= 3 && (
                        <Crown className="w-4 h-4 shrink-0 sm:w-5 sm:h-5 fill-current" />
                      )}
                      {series.rank}
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 font-semibold text-gray-800">
                    <Link href={`/series/${series.seriesId}`} className="block truncate hover:underline" title={series.seriesName}>
                      {series.seriesName}
                    </Link>
                  </td>
                  <td className="p-2 sm:p-4 whitespace-nowrap text-right font-mono text-lg sm:text-xl text-gray-900 font-bold">
                    {series.solvedCount.toLocaleString()}
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
