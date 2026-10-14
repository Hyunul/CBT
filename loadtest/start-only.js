// 응시 시작 API만 고정 속도로 호출해 지연시간을 잰다(응시 기록이 많이 쌓인 시험에서의 확장성 확인용).
//   k6 run -e BASE_URL=http://127.0.0.1:18081 -e EXAM_ID=24 -e RATE=50 loadtest/start-only.js
// 로컬 Compose 스택 전용.
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:18081";

export const options = {
  scenarios: {
    start: {
      executor: "constant-arrival-rate",
      rate: Number(__ENV.RATE || 50),
      timeUnit: "1s",
      duration: __ENV.DURATION || "30s",
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export default function () {
  const r = http.post(`${BASE}/api/attempts/start/${__ENV.EXAM_ID}`, null, { tags: { name: "start" } });
  check(r, { "start 200": (res) => res.status === 200 });
}
