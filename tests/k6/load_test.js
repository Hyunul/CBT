import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  // 스트레스 테스트 설정 (Step Stress)
  stages: [
    { duration: '30s', target: 50 },   // 1단계: 50명 (워밍업)
    { duration: '30s', target: 100 },  // 2단계: 100명
    { duration: '30s', target: 200 },  // 3단계: 200명
    { duration: '30s', target: 300 },  // 4단계: 300명 (한계 도전)
    { duration: '30s', target: 0 },    // 종료
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
      nickname: `Nick_${username}`,
    });
    
    // API 경로에 /api가 포함되어 있는지 확인 필요 (nginx 설정에 따름)
    // 현재 Backend 직접 호출 시에는 /api 없이 호출될 수 있음. 상황에 맞춰 조정.
    // 여기서는 Backend 직접 호출(8080) 기준: Controller 매핑에 따라 다름.
    // 보통 Controller가 /api/auth 로 매핑되어 있다면 그대로 사용.
    
    // Nginx 통해서 접근시: http://host.docker.internal/api/...
    // Backend 직접 접근시: http://host.docker.internal:8080/api/...
    
    // 사용자 환경에 맞춰 조정: 여기선 Backend 직접 접근 가정 (/api가 Controller에 붙어있다고 가정)
    
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
      const res = http.get(`${BASE_URL}/api/exams`, authParams);
      check(res, { 'get exams status is 200': (r) => r.status === 200 });
      
      try {
          const exams = res.json('content'); // Page 객체라고 가정
          if (exams && exams.length > 0) {
              examId = exams[0].id;
          }
      } catch (e) {
          // console.log('Error parsing exams');
      }
  });

  let attemptId = null;

  group('3. Start Exam', function () {
    // Controller expects /start/{examId}
    const res = http.post(`${BASE_URL}/api/attempts/start/${examId}`, null, authParams);
    check(res, {
        'start attempt status is 200': (r) => r.status === 200,
        'has attemptId': (r) => {
            // AttemptController returns simple Long (attemptId) directly or inside ApiResponse?
            // Checking AttemptController.java: return ResponseEntity.ok(attempt.getId()); 
            // It returns just a number (Long).
            // But wait, does it use ApiResponse? No, it returns ResponseEntity<Long>.
            // So response body is just the ID (e.g., "123").
            
            // However, global exception handler or aspects might wrap it. 
            // Assuming direct return for now based on code.
            // But let's handle both cases (plain text/number or JSON object)
            
            // If it returns a number directly:
            return r.body && !isNaN(r.body);
        }
    });
    if (res.status === 200) {
        // Try parsing as JSON if it's an object, otherwise treat as raw ID
        try {
            const json = res.json();
            if (json && json.data) attemptId = json.data; // wrapped
            else if (json && json.id) attemptId = json.id; // object
            else attemptId = json; // number
        } catch(e) {
            attemptId = parseInt(res.body);
        }
    }
  });

  if (!attemptId) return;

  // 잠시 시험 푸는 척 대기 (1~3초)
  sleep(Math.random() * 2 + 1);

  group('4. Submit Exam (Ranking Update Trigger)', function () {
    const res = http.post(`${BASE_URL}/api/attempts/${attemptId}/submit`, null, authParams);
    check(res, {
      'submit status is 200': (r) => r.status === 200,
      'score returned': (r) => r.json('data.totalScore') !== undefined,
    });
  });
  
  sleep(1);
}
