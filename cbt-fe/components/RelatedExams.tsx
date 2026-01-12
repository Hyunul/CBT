import Link from "next/link";

interface RelatedExamItem {
  id: number | string;
  title: string;
  questionCount?: number;
  durationSec?: number;
}

interface RelatedExamsProps {
  items: RelatedExamItem[];
}

export default function RelatedExams({ items }: RelatedExamsProps) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="mb-4 text-xl font-bold">관련 시험</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background p-6 text-sm text-muted-foreground">
          관련 시험이 준비되면 여기에 표시됩니다.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((exam) => (
            <Link
              key={exam.id}
              href={`/exam/${exam.id}`}
              className="rounded-xl border bg-background p-4 transition hover:border-primary"
            >
              <p className="text-base font-semibold">{exam.title}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                {exam.questionCount ? `${exam.questionCount}문항` : "문항 정보 준비 중"}
                {exam.durationSec ? ` · ${Math.round(exam.durationSec / 60)}분` : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
