import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  // 스트레스 테스트 설정 (Step Stress)
  stages: [
    { duration: '30s', target: 100 },   // 1단계: 100명 (Warm-up)
    { duration: '30s', target: 500 },   // 2단계: 500명 (Load)
    { duration: '30s', target: 1000 },  // 3단계: 1000명 (Stress)
    { duration: '30s', target: 1500 },  // 4단계: 1500명 (Spike/Breakpoint)
    { duration: '30s', target: 0 },     // 종료
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 2초 넘어가면 실패로 간주
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:8080'; // Docker 내부 통신용

export default function () {
  const uniqueId = randomString(8);
  const username = `user_${uniqueId}`;
  const password = 'password123';

  let token = '';
  let examId = 1; // 기본값, 실제 조회 후 덮어씀

  group('1. Signup & Login', function () {
    // 1-1. 회원가입
    const signupPayload = JSON.stringify({
      username: username,
      password: password,
      email: `${username}@example.com`,
      role: 'ROLE_USER', // DTO에 맞춰 수정
    });
    
    const params = { headers: { 'Content-Type': 'application/json' } };
    
    const signupRes = http.post(`${BASE_URL}/api/auth/signup`, signupPayload, params);
    check(signupRes, {
      'signup status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    // 1-2. 로그인
    const loginPayload = JSON.stringify({
      username: username,
      password: password,
    });
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, params);
    
    // Debug: 첫 번째 요청만 로그 출력
    if (__ITER === 0) {
        console.log('Login Response:', loginRes.body);
    }

    const loginCheck = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'has token': (r) => {
          const body = r.json();
          // AuthController returns ApiResponse<LoginRes>
          return body && body.data && body.data.accessToken !== undefined;
      },
    });

    if (loginCheck) {
        token = loginRes.json().data.accessToken;
    }
  });

  if (!token) return;

  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  group('2. Get Exam List', function() {
      // ExamController.getExamsBySeries returns ApiResponse<List<Exam>>
      const res = http.get(`${BASE_URL}/api/exams`, authParams);
      check(res, { 'get exams status is 200': (r) => r.status === 200 });
      
      try {
          const body = res.json();
          const exams = body.data; // ApiResponse wrapper
          if (exams && Array.isArray(exams) && exams.length > 0) {
              examId = exams[0].id;
          }
      } catch (e) {
          console.log('Error parsing exams');
      }
  });

  let attemptId = null;

  group('3. Start Exam', function () {
    // AttemptController.startAttempt returns ResponseEntity<Long> (Raw ID)
    const res = http.post(`${BASE_URL}/api/attempts/start/${examId}`, null, authParams);
    check(res, {
        'start attempt status is 200': (r) => r.status === 200,
        'has attemptId': (r) => r.body && !isNaN(r.body)
    });
    
    if (res.status === 200) {
        // Raw Long response
        attemptId = parseInt(res.body);
    }
  });

  if (!attemptId) return;

  // 잠시 시험 푸는 척 대기 (1~3초)
  sleep(Math.random() * 2 + 1);

  group('4. Submit Exam (Ranking Update Trigger)', function () {
    // AttemptController.submitAttempt returns ResponseEntity<AttemptSubmitRes> (Raw JSON, not ApiResponse)
    const res = http.post(`${BASE_URL}/api/attempts/${attemptId}/submit`, null, authParams);
    check(res, {
      'submit status is 200': (r) => r.status === 200,
      'score returned': (r) => {
          const body = r.json();
          return body && body.totalScore !== undefined;
      }
    });
  });
  
  sleep(1);
}
