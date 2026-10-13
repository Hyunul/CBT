const faqItems = [
  {
    title: "응시 기록은 어디에 저장되나요?",
    description: "회원은 나의 응시 이력에서 확인할 수 있습니다. 게스트는 같은 브라우저에서만 결과를 확인할 수 있으며 브라우저 저장소를 지우면 접근할 수 없습니다.",
  },
  {
    title: "시험을 다시 볼 수 있나요?",
    description: "같은 시험을 여러 번 응시할 수 있습니다. 모든 제출 이력은 보관되며 시험별 랭킹에는 최고 점수가 반영됩니다.",
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
