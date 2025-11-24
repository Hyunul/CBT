"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function NewExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [durationSec, setDurationSec] = useState(600);

  const createExam = async () => {
    const res = await api<{ data: any }>("/api/exams", {
      method: "POST",
      body: JSON.stringify({
        title,
        durationSec,
        published: false,
      }),
    });

    alert("시험이 생성되었습니다.");
    router.push(`/admin/exams/${res.data.id}`);
  };

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-4">
      <h1 className="text-xl font-bold">시험 생성</h1>

      <input
        placeholder="시험 제목"
        className="w-full border p-2 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="number"
        placeholder="시험 시간(초)"
        className="w-full border p-2 rounded"
        value={durationSec}
        onChange={(e) => setDurationSec(Number(e.target.value))}
      />

      <button className="btn-primary" onClick={createExam}>
        생성
      </button>
    </main>
  );
}
