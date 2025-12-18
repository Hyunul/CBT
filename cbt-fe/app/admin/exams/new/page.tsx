"use client";

import { useState, useEffect } from "react";
import { api, getSeriesList, ExamSeries } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NewExamPage() {
    const router = useRouter();

    // 상태값들
    const [title, setTitle] = useState("");
    const [durationSec, setDurationSec] = useState(600);
    const [published, setPublished] = useState(false);
    
    // 시리즈 관련
    const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
    const [round, setRound] = useState<number | "">("");

    useEffect(() => {
        getSeriesList().then(setSeriesList).catch(console.error);
    }, []);

    const createExam = async () => {
        try {
            const res = await api<{ data: any }>("/api/exams", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    durationSec,
                    isPublished: published,
                    seriesId: selectedSeriesId,
                    round: round === "" ? null : Number(round),
                }),
            });

            toast.success("시험이 생성되었습니다.");
            router.push(`/admin/exams/edit/${res.data.id}`);
        } catch (error) {
            toast.error("시험 생성에 실패했습니다.");
            console.error(error);
        }
    };

    return (
        <main className="max-w-3xl mx-auto p-8 space-y-5">
            <h1 className="text-2xl font-bold">시험 생성</h1>

            {/* 제목 */}
            <div>
                <label className="block font-semibold mb-1">시험 제목</label>
                <input
                    className="w-full border p-2 rounded"
                    placeholder="예) 2025 NCS 직업기초능력 시험"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* 시리즈 (과목) 선택 */}
            <div>
                <label className="block font-semibold mb-1">시리즈(과목) 선택 (선택)</label>
                <select 
                    className="w-full border p-2 rounded"
                    value={selectedSeriesId || ""}
                    onChange={(e) => setSelectedSeriesId(e.target.value ? Number(e.target.value) : null)}
                >
                    <option value="">-- 시리즈 선택 안함 --</option>
                    {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">시리즈가 없다면 '시리즈 관리'에서 먼저 생성하세요.</p>
            </div>

            {/* 회차 */}
            <div>
                <label className="block font-semibold mb-1">회차 (선택)</label>
                <input
                    type="number"
                    className="w-full border p-2 rounded"
                    placeholder="예) 1"
                    value={round}
                    onChange={(e) => setRound(e.target.value === "" ? "" : Number(e.target.value))}
                />
            </div>

            {/* 제한시간 */}
            <div>
                <label className="block font-semibold mb-1">
                    시험 시간(초)
                </label>
                <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                />
            </div>

            {/* 옵션 */}
            <div className="flex gap-10 items-center">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={published}
                        onChange={() => setPublished(!published)}
                    />
                    공개 여부
                </label>
            </div>

            {/* 버튼 */}
            <button
                className="btn-primary w-full py-2 text-lg"
                onClick={createExam}
            >
                시험 생성
            </button>
        </main>
    );
}