"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";

export default function NewExamPage() {
  const router = useRouter();
  const { userId } = useAuth();

  // 상태값들
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationSec, setDurationSec] = useState(600);
  const [totalScore, setTotalScore] = useState(0);
  const [passScore, setPassScore] = useState(0);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("NORMAL");
  const [tags, setTags] = useState("");
  const [isRandom, setIsRandom] = useState(false);
  const [published, setPublished] = useState(false);

  const createExam = async () => {
    const res = await api<{ data: any }>("/api/exams", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        durationSec,
        totalScore,
        passScore,
        category,
        difficulty,
        tags,
        isRandom,
        published,
        createdBy: userId,
      }),
    });

    alert("시험이 생성되었습니다.");
    router.push(`/admin/exams/${res.data.id}`);
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

      {/* 설명 */}
      <div>
        <label className="block font-semibold mb-1">설명</label>
        <textarea
          className="w-full border p-2 rounded"
          placeholder="시험에 대한 설명을 입력하세요"
          value={description}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* 카테고리 / 난이도 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1">카테고리</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="예) NCS, IT, 국어 등"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="flex-1">
          <label className="block font-semibold mb-1">난이도</label>
          <select
            className="w-full border p-2 rounded"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="EASY">EASY</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HARD">HARD</option>
          </select>
        </div>
      </div>

      {/* 제한시간 */}
      <div>
        <label className="block font-semibold mb-1">시험 시간(초)</label>
        <input
          type="number"
          className="w-full border p-2 rounded"
          value={durationSec}
          onChange={(e) => setDurationSec(Number(e.target.value))}
        />
      </div>

      {/* 점수 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1">총점</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={totalScore}
            onChange={(e) => setTotalScore(Number(e.target.value))}
          />
        </div>

        <div className="flex-1">
          <label className="block font-semibold mb-1">합격 점수</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={passScore}
            onChange={(e) => setPassScore(Number(e.target.value))}
          />
        </div>
      </div>

      {/* 태그 */}
      <div>
        <label className="block font-semibold mb-1">태그</label>
        <input
          className="w-full border p-2 rounded"
          placeholder="쉼표로 구분 (예: NCS, 의사소통, 문제해결)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {/* 옵션 */}
      <div className="flex gap-10 items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRandom}
            onChange={() => setIsRandom(!isRandom)}
          />
          문제 랜덤 출제
        </label>

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
      <button className="btn-primary w-full py-2 text-lg" onClick={createExam}>
        시험 생성
      </button>
    </main>
  );
}
