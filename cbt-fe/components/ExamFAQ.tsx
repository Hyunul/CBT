const faqItems = [
  {
    title: "응시 기록은 어디에 저장되나요?",
    description: "응시 기록과 점수는 계정에 저장되며, 마이페이지에서 확인할 수 있습니다.",
  },
  {
    title: "시험을 다시 볼 수 있나요?",
    description: "동일 시험은 여러 번 응시할 수 있으며, 최신 기록이 기준이 됩니다.",
  },
  {
    title: "모바일에서도 응시 가능한가요?",
    description: "모바일 환경에서도 응시할 수 있도록 반응형 UI를 지원합니다.",
  },
];

export default function ExamFAQ() {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="mb-4 text-xl font-bold">자주 묻는 질문</h2>
      <div className="space-y-4">
        {faqItems.map((item) => (
          <div key={item.title} className="rounded-xl border bg-background p-4">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
