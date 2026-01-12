import { PlayCircle, Eye } from "lucide-react";

interface ExamHeroProps {
  title: string;
  description?: string;
  badges?: string[];
  starting: boolean;
  onStart: () => void;
}

export default function ExamHero({
  title,
  description,
  badges = [],
  starting,
  onStart,
}: ExamHeroProps) {
  return (
    <section className="rounded-2xl border bg-card p-8 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base font-bold sm:w-auto"
          onClick={onStart}
          disabled={starting}
        >
          {starting ? (
            "시작 중..."
          ) : (
            <>
              <PlayCircle className="h-5 w-5" />
              무료로 시작하기
            </>
          )}
        </button>
        <a
          className="flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary sm:w-auto"
          href="#preview"
        >
          <Eye className="h-4 w-4" />
          문항 미리보기
        </a>
      </div>
    </section>
  );
}
