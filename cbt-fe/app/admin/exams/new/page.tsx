"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NewExamPage() {
    const router = useRouter();

    // 상태값들
    const [title, setTitle] = useState("");
    const [durationSec, setDurationSec] = useState(600);
    const [published, setPublished] = useState(false);

    const createExam = async () => {
        try {
            const res = await api<{ data: any }>("/api/exams", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    durationSec,
                    isPublished: published,
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