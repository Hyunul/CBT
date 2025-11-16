"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { useAuth } from "@/store/useAuth";

export default function ExamDetailPage() {
    const { id } = useParams(); // ←★ 여기
    const [exam, setExam] = useState<any>(null);
    const { userId } = useAuth();

    useEffect(() => {
        if (!id) return;

        api<{ data: any }>(`/api/exams/${id}`)
            .then((res) => setExam(res.data))
            .catch((err) => console.error(err));
    }, [id]);

    const startExam = async () => {
        try {
            const res = await api<{ data: any }>("/api/attempts", {
                method: "POST",
                body: JSON.stringify({ examId: exam.id, userId }),
            });
            window.location.href = `/attempts/${res.data.id}`;
        } catch (err) {
            alert("응시 시작 실패");
        }
    };

    if (!exam) return <div className="p-8">로딩 중...</div>;

    return (
        <main className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-3">{exam.title}</h1>
            <p className="text-gray-600 mb-4">
                총점: {exam.totalScore}점 | 제한시간: {exam.durationSec}초
            </p>
            <button className="btn-primary" onClick={startExam}>
                시험 시작
            </button>
        </main>
    );
}
