"use client";

import { useEffect, useState } from "react";
import { api, Exam } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ExamDetailPage() {
    const router=useRouter();
    const { id } = useParams(); // ←★ 여기
    const [exam, setExam] = useState<Exam | null>(null);

    useEffect(() => {
        if (!id) return;

        api<{ data: Exam }>(`/api/exams/${id}`)
            .then((res) => setExam(res.data))
            .catch((err) => console.error(err));
    }, [id]);

    const startExam = async () => {
        try {
            const attemptId = await api<number>(`/api/attempts/start/${exam!.id}`, { method: "POST" });
            router.push(`/attempts/${attemptId}`);
        } catch (err) {
            console.error("Failed to start exam:", err);
            toast.error("응시 시작에 실패했습니다. 다시 시도해주세요.");
        }
    };

    if (!exam) return <div className="p-8">로딩 중...</div>;

    return (
        <main className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-3">{exam.title}</h1>
            <p className="text-gray-600 mb-4">
                총점: {exam.totalScore}점 | 제한시간: {exam.durationSec}초
            </p>
            <button className="btn-primary disabled:opacity-50" disabled={!exam.isPublished} onClick={startExam}>
                {exam.isPublished ? "시험 시작" : "시험을 공개한 후 응시할 수 있습니다."}
            </button>
        </main>
    );
}
