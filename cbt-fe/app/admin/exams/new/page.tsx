"use client";

import { useState, useEffect } from "react";
import { api, getSeriesList, ExamSeries, Exam, type ExamType } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NewExamPage() {
    const router = useRouter();

    // 상태값들
    const [title, setTitle] = useState("");
    const [durationSec, setDurationSec] = useState(600);
    const [type, setType] = useState<ExamType>("WRITTEN");
    
    // 시리즈 관련
    const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
    const [round, setRound] = useState<number | "">("");

    useEffect(() => {
        getSeriesList().then(setSeriesList).catch(console.error);
    }, []);

    const createExam = async () => {
        try {
            const res = await api<{ data: Exam }>("/api/exams", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    type,
                    durationSec,
                    isPublished: false,
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
                    className="w-full border p-2 rounded-sm"
                    placeholder="예) 2025 NCS 직업기초능력 시험"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* 시리즈 (과목) 선택 */}
            <div>
                <label className="block font-semibold mb-1">시리즈(과목) 선택 (선택)</label>
                <select 
                    className="w-full border p-2 rounded-sm"
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
                <p className="text-xs text-gray-500 mt-1">시리즈가 없다면 시리즈 관리에서 먼저 생성하세요.</p>
            </div>

            {/* 회차 */}
            <div>
                <label className="block font-semibold mb-1">회차 (선택)</label>
                <input
                    type="number"
                    className="w-full border p-2 rounded-sm"
                    placeholder="예) 1"
                    value={round}
                    onChange={(e) => setRound(e.target.value === "" ? "" : Number(e.target.value))}
                />
            </div>

            <div>
                <label htmlFor="exam-type" className="block font-semibold mb-1">시험 유형</label>
                <select
                    id="exam-type"
                    className="w-full border p-2 rounded-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value as ExamType)}
                >
                    <option value="WRITTEN">필기</option>
                    <option value="PRACTICAL">실기</option>
                </select>
            </div>

            {/* 제한시간 */}
            <div>
                <label htmlFor="exam-duration" className="block font-semibold mb-1">
                    시험 시간(초)
                </label>
                <input
                    id="exam-duration"
                    aria-describedby={type === "PRACTICAL" ? "exam-duration-help" : undefined}
                    type="number"
                    className="w-full border p-2 rounded-sm"
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                />
                {type === "PRACTICAL" && (
                    <p id="exam-duration-help" className="mt-1 text-xs text-muted-foreground">실기 학습에는 제한 시간이 적용되지 않습니다. 이 값은 시험 정보 저장에 필요합니다.</p>
                )}
            </div>

            <p className="text-sm text-gray-500">문항을 저장한 뒤 시험을 공개할 수 있습니다.</p>

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
