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
    const [rankingTitle, setRankingTitle] = useState("글로벌 응시 횟수 랭킹");

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
        setLoading(true);

        let url = "";
        if (selectedRanking === "global") {
            url = "/api/ranking/global/submissions";
            setRankingTitle("글로벌 응시 횟수 랭킹");
        } else {
            url = `/api/ranking/exam/${selectedRanking}`;

            const examTitle = exams.find(
                (e) => e.id.toString() === selectedRanking
            )?.title;

            setRankingTitle(`"${examTitle || "선택된 시험"}" 점수 랭킹`);
        }

        api<RankDto[]>(url)
            .then((res) => {
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
            .finally(() => setLoading(false));
    }, [selectedRanking, exams]);

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
                <h1 className="text-4xl font-extrabold text-gray-900">
                    {rankingTitle}
                </h1>

                <select
                    value={selectedRanking}
                    onChange={(e) => setSelectedRanking(e.target.value)}
                    className="w-full sm:w-80 p-3 border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-700 font-medium"
                >
                    <option value="global">글로벌 응시 횟수 랭킹</option>

                    {exams.map((exam) => (
                        <option key={exam.id} value={exam.id.toString()}>
                            {exam.title} 점수 랭킹
                        </option>
                    ))}
                </select>
            </div>

            {/* 테이블 */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    </div>
                ) : rankings.length === 0 ? (
                    <p className="text-center py-20 text-gray-500 text-xl font-medium">
                        현재 표시할 랭킹 데이터가 없습니다.
                    </p>
                ) : (
                    <table className="w-full text-left table-auto">
                        <thead className="bg-indigo-50 border-b border-indigo-200">
                            <tr>
                                <th className="p-4 w-24 text-center text-indigo-700 font-semibold">
                                    순위
                                </th>
                                <th className="p-4 text-indigo-700 font-semibold">
                                    사용자
                                </th>
                                <th className="p-4 w-32 text-right text-indigo-700 font-semibold">
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
                                    <td className="p-4 font-bold text-lg text-center">
                                        <div
                                            className={`flex justify-center items-center gap-2 p-2 rounded-lg ${getRankColor(
                                                user.rank
                                            )}`}
                                        >
                                            {user.rank <= 3 && (
                                                <Crown className="w-5 h-5 fill-current" />
                                            )}
                                            {user.rank}
                                        </div>
                                    </td>

                                    <td className="p-4 font-semibold text-gray-800">
                                        {user.username}
                                    </td>

                                    <td className="p-4 text-right font-mono text-xl text-gray-900 font-bold">
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
