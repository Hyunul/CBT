"use client";

import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

// === 인터페이스 정의 (백엔드 AttemptReviewRes 추정) ===
interface ReviewItem {
  questionId: number;
  questionText: string;
  questionType: "MCQ" | "SUBJECTIVE";
  userSelectedChoice: string | null; // MCQ 선택지 키 ('A', 'B' 등)
  responseText: string | null; // 수정: 백엔드 데이터에 맞게 'userResponseText' -> 'responseText'로 변경
  correctAnswer: string; // 정답 텍스트 또는 정답 키
  isCorrect: boolean; // 정답 여부
  scoreEarned: number | null | undefined; // null/undefined 허용하도록 타입 수정
  score: number; // 수정: 'maxScore' -> 'score'로 변경
  explanation: string; // 해설
  choices: string | null; // MCQ의 경우 선택지 JSON 문자열
}

// === 리뷰 카드 컴포넌트 ===
function ReviewCard({ item, index }: { item: ReviewItem; index: number }) {
  // 선택지 JSON 문자열을 배열로 파싱
  const choicesArray: [string, string][] = useMemo(() => {
    if (item.questionType === "MCQ" && item.choices) {
      try {
        const choicesObject: Record<string, string> = JSON.parse(item.choices);
        return Object.entries(choicesObject);
      } catch (e) {
        console.error(`Question ${item.questionId} 선택지 JSON 파싱 오류:`, e);
      }
    }
    return [];
  }, [item.choices, item.questionType, item.questionId]);

  // 사용자가 선택한 선택지의 텍스트를 찾습니다. (MCQ의 경우)
  const userChoiceText = useMemo(() => {
    if (item.questionType === "MCQ" && item.userSelectedChoice) {
      const found = choicesArray.find(
        ([key]) => key === item.userSelectedChoice
      );
      return found
        ? `${found[0]}. ${found[1]}`
        : `선택지 ${item.userSelectedChoice}`;
    }
    return null;
  }, [item.questionType, item.userSelectedChoice, choicesArray]);

  const resultColor = item.isCorrect
    ? "bg-green-100 border-green-400"
    : "bg-red-100 border-red-400";
  const resultText = item.isCorrect ? "정답" : "오답";
  const resultIcon = item.isCorrect ? (
    <CheckCircle className="w-5 h-5 text-green-600" />
  ) : (
    <XCircle className="w-5 h-5 text-red-600" />
  );

  // 유형에 따라 표시할 답변 값을 결정합니다.
  let userAnswerDisplay: string;
  const isMCQ = item.questionType === "MCQ";

  if (isMCQ) {
    userAnswerDisplay =
      userChoiceText ||
      (item.userSelectedChoice
        ? `[선택: ${item.userSelectedChoice}]`
        : "미응답");
  } else {
    userAnswerDisplay = item.responseText || "미응답";
  }

  // ⭐⭐⭐ 획득 점수 계산 로직 개선 (Nullish Coalescing Operator 사용) ⭐⭐⭐
  const calculatedEarnedScore = item.isCorrect ? item.score : 0;
  // item.scoreEarned가 null 또는 undefined가 아니라면 그 값을 사용하고, 아니면 isCorrect에 따라 계산된 값을 사용합니다.
  const earnedScore = item.scoreEarned ?? calculatedEarnedScore;
  // ⭐⭐⭐

  return (
    <div className={`p-6 border rounded-lg shadow-lg bg-white ${resultColor}`}>
      {/* 1. 결과 및 점수 헤더 */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-300">
        <h3 className="text-xl font-bold text-gray-800">
          <span className="text-blue-600 mr-2">Q{index + 1}.</span>{" "}
          {item.questionText}
        </h3>
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white shadow-md flex-shrink-0 min-w-[100px]">
          {/* 첫 번째 줄: 아이콘 + 정오답 텍스트 */}
          <div className="flex items-center gap-1">
            {resultIcon}
            <span
              className={`font-semibold whitespace-nowrap ${
                item.isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {resultText}
            </span>
          </div>

          {/* 두 번째 줄: 점수 */}
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {/* 계산된 earnedScore 사용 */}({earnedScore} / {item.score}점)
          </span>
        </div>
      </div>

      {/* 2. 답변 상세 */}
      <div className="space-y-4 text-gray-700">
        <div className="border p-3 rounded-md bg-gray-50">
          <p className="font-medium text-gray-600 mb-1">나의 답:</p>
          <p className={`whitespace-pre-line ${isMCQ ? "font-bold" : ""}`}>
            {userAnswerDisplay}
          </p>
        </div>

        {/* 3. 정답 및 해설 */}
        <div className="border p-4 rounded-md bg-white shadow-inner">
          <p className="font-bold text-lg text-green-700 mb-2">
            ✅ 정답: {item.correctAnswer}
          </p>

          <p className="font-medium text-gray-600 mt-4 mb-1">해설:</p>
          <p className="whitespace-pre-line text-sm">{item.explanation}</p>
        </div>

        {/* MCQ 전체 선택지 (선택 사항) */}
        {item.questionType === "MCQ" && (
          <div className="mt-4 pt-3 border-t">
            <p className="font-medium text-gray-600 mb-2">모든 선택지:</p>
            <ul className="space-y-1 text-sm">
              {choicesArray.map(([key, text]) => (
                <li
                  key={key}
                  className={`p-1 rounded ${
                    key === item.correctAnswer
                      ? "bg-yellow-50 font-semibold"
                      : ""
                  }`}
                >
                  {key}. {text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// === 메인 페이지 컴포넌트 ===
export default function AttemptResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reviewList, setReviewList] = useState<ReviewItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 전체 점수 및 문제 수 계산
  const totalQuestions = reviewList?.length || 0;
  const totalMaxScore =
    reviewList?.reduce((sum, item) => sum + item.score, 0) || 0;

  // ⭐⭐⭐ 획득 점수 합산 로직 개선 (Nullish Coalescing Operator 사용) ⭐⭐⭐
  const totalEarnedScore =
    reviewList?.reduce((sum, item) => {
      const calculatedEarned = item.isCorrect ? item.score : 0;
      // item.scoreEarned가 null 또는 undefined가 아니라면 그 값을 사용하고, 아니면 isCorrect에 따라 계산된 값을 사용합니다.
      const earned = item.scoreEarned ?? calculatedEarned;
      return sum + earned;
    }, 0) || 0;
  // ⭐⭐⭐

  const correctCount = reviewList?.filter((item) => item.isCorrect).length || 0;
  const examTitle = "CBT 시험 결과"; // 백엔드에서 제목 정보를 함께 보내주면 더 좋음. 일단 하드코딩

  useEffect(() => {
    const attemptId = Array.isArray(id) ? id[0] : id;
    if (!attemptId) return;

    setLoading(true);
    setError(null);

    // GET /api/attempts/{attemptId}/result API 호출
    api<ReviewItem[]>(`/api/attempts/${attemptId}/result`)
      .then((res) => {
        setReviewList(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("시험 결과 로드 실패:", err);
        setError(
          "시험 결과를 불러오는 데 실패했습니다. 응시 ID를 확인해 주세요."
        );
        setLoading(false);
      });
  }, [id]);

  const handleGoBack = () => {
    router.back();
  };

  if (loading)
    return (
      <div className="p-12 text-center text-xl">
        시험 결과 정보를 불러오는 중...
      </div>
    );
  if (error)
    return (
      <div className="p-12 text-center text-red-500 text-xl font-semibold">
        {error}
      </div>
    );
  if (!reviewList || totalQuestions === 0)
    return <div className="p-12 text-center text-xl">데이터가 없습니다.</div>;

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-10">
      {/* 헤더 및 요약 정보 */}
      <div className="border-b pb-5 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-gray-900">
          {examTitle} - 결과
        </h1>
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition duration-150"
        >
          <ArrowLeft className="w-5 h-5" />
          돌아가기
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-6 text-center shadow-xl rounded-xl p-6 bg-blue-50 border border-blue-200">
        <div className="space-y-1">
          <p className="text-sm text-gray-600 font-medium">총점</p>
          <p className="text-3xl font-bold text-blue-700">
            {totalEarnedScore}{" "}
            <span className="text-xl font-normal text-gray-500">
              / {totalMaxScore}
            </span>
          </p>
        </div>
        <div className="space-y-1 border-x border-blue-200">
          <p className="text-sm text-gray-600 font-medium">정답 수</p>
          <p className="text-3xl font-bold text-green-600">
            {correctCount}{" "}
            <span className="text-xl font-normal text-gray-500">
              / {totalQuestions}
            </span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-600 font-medium">합격 여부</p>
          {/* 합격 기준은 임의로 60점이라 가정 */}
          <p
            className={`text-3xl font-bold ${
              totalEarnedScore >= totalMaxScore * 0.6
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {totalEarnedScore >= totalMaxScore * 0.6 ? "합격" : "불합격"}
          </p>
        </div>
      </div>

      {/* 문제별 리뷰 목록 */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
          문제별 상세 리뷰
        </h2>
        {reviewList.map((item, index) => (
          <ReviewCard key={item.questionId} item={item} index={index} />
        ))}
      </div>
    </main>
  );
}
