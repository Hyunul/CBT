interface QuestionPreviewItem {
  id: number | string;
  text: string;
}

interface QuestionPreviewProps {
  items: QuestionPreviewItem[];
}

export default function QuestionPreview({ items }: QuestionPreviewProps) {
  return (
    <section id="preview" className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">문항 미리보기</h2>
        <span className="text-xs text-muted-foreground">최대 5문항</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background p-6 text-sm text-muted-foreground">
          미리보기 문항은 준비 중입니다.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-xl border bg-background p-4 text-sm"
            >
              <p className="font-medium">Q{index + 1}. {item.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">정답은 응시 후 확인할 수 있습니다.</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
