// 필기 모의고사 한 번의 흐름: 시작 → 문항 조회 → 자동 저장 5회 → 100문항 제출 → 결과 조회
// 자동 저장은 앱(answerPayload)과 같이 매번 전체 문항을 보내고, 아직 안 푼 문항은 null 이다(20·40·…·100문항 응답).
//
// 로컬 Compose 스택 전용. nginx 의 요청 제한(응시 시작 1r/s/IP)을 피해 백엔드에 직접 붙는다.
//   k6 run -e BASE_URL=http://127.0.0.1:18081 -e EXAM_IDS=17,18,19,20,21,22,23,24 loadtest/attempt-flow.js
// 운영 서버에 돌리지 말 것.
import http from "k6/http";
import { check, fail } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:18081";
const EXAMS = (__ENV.EXAM_IDS || "").split(",").filter(Boolean);
if (!EXAMS.length) throw new Error("EXAM_IDS 를 지정하세요 (공개된 필기 시험 id, 쉼표 구분)");

export const options = {
  scenarios: {
    attempts: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: Number(__ENV.VUS || 50) },
        { duration: __ENV.HOLD || "1m", target: Number(__ENV.VUS || 50) },
        { duration: "10s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:submit}": ["p(95)<1000"],
    "http_req_duration{name:save}": ["p(95)<500"],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

const JSON_HEADERS = { "Content-Type": "application/json" };

export default function () {
  const exam = EXAMS[Math.floor(Math.random() * EXAMS.length)];
  const start = http.post(`${BASE}/api/attempts/start/${exam}`, null, { tags: { name: "start" } });
  if (!check(start, { "start 200": (r) => r.status === 200 })) fail(`start ${start.status}`);
  const id = start.body;
  const auth = { ...JSON_HEADERS, "X-Attempt-Key": start.headers["X-Attempt-Key"] };

  const detail = http.get(`${BASE}/api/attempts/${id}`, { headers: auth, tags: { name: "detail" } });
  check(detail, { "detail 200": (r) => r.status === 200 });
  const questions = detail.json("questions").map((q) => q.id);

  const answers = questions.map((q) => ({ questionId: q, selectedChoices: String(1 + Math.floor(Math.random() * 4)) }));
  for (let n = 20; n <= answers.length; n += 20) {
    const progress = answers.map((a, i) => (i < n ? a : { questionId: a.questionId, selectedChoices: null }));
    const save = http.post(`${BASE}/api/attempts/${id}/answers`, JSON.stringify(progress),
      { headers: auth, tags: { name: "save" } });
    check(save, { "save 204": (r) => r.status === 204 });
  }

  const submit = http.post(`${BASE}/api/attempts/${id}/submit`, JSON.stringify(answers),
    { headers: auth, tags: { name: "submit" } });
  check(submit, { "submit 200": (r) => r.status === 200 && r.json("questionCount") === questions.length });

  const result = http.get(`${BASE}/api/attempts/${id}/result`, { headers: auth, tags: { name: "result" } });
  check(result, { "result 200": (r) => r.status === 200 });
}
