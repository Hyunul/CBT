import { Clock, Hash, Gauge } from "lucide-react";

interface ExamStatsProps {
  questionCount: number;
  durationSec: number;
  difficulty?: string;
}

export default function ExamStats({
  questionCount,
  durationSec,
  difficulty,
}: ExamStatsProps) {
  const minutes = Math.round(durationSec / 60);

  return (
    <section className="grid gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-3">
      <div className="flex items-center gap-3">
        <Hash className="h-6 w-6 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">총 문항</p>
          <p className="text-lg font-semibold">{questionCount}개</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">제한 시간</p>
          <p className="text-lg font-semibold">{minutes}분</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Gauge className="h-6 w-6 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">난이도</p>
          <p className="text-lg font-semibold">{difficulty || "준비 중"}</p>
        </div>
      </div>
    </section>
  );
}
