"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface RankingUser {
  userId: number;
  email: string;
  score: number;
  submissions: number; // 제출 횟수
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: RankingUser[] }>("/api/ranking/top")
      .then((res) => setRankings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">불러오는 중...</div>;

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">🔥 주간 랭킹</h1>

      <ul className="divide-y bg-white shadow rounded">
        {rankings.map((user, idx) => (
          <li
            key={user.userId}
            className="p-4 flex justify-between items-center"
          >
            <div className="flex gap-4 items-center">
              <div className="text-xl font-bold w-10">{idx + 1}</div>
              <div>
                <div className="font-semibold">{user.email}</div>
                <div className="text-sm text-gray-500">
                  제출 {user.submissions}회
                </div>
              </div>
            </div>

            <span className="font-bold text-blue-600 text-lg">
              {user.score}점
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
