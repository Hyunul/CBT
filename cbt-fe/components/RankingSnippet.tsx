interface RankingItem {
  name: string;
  score: number;
}

interface RankingSnippetProps {
  items: RankingItem[];
}

export default function RankingSnippet({ items }: RankingSnippetProps) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">상위 랭킹</h2>
        <a className="text-sm text-primary hover:underline" href="/ranking">
          전체 랭킹 보기
        </a>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background p-6 text-sm text-muted-foreground">
          랭킹 데이터가 아직 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between rounded-xl border bg-background px-4 py-3 text-sm"
            >
              <span className="font-medium">{index + 1}. {item.name}</span>
              <span className="text-muted-foreground">{item.score}점</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
