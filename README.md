# OptiCBT · 온라인 고성능 CBT 플랫폼

Next.js 15(App Router)와 Spring Boot 3를 사용하는 온라인 시험 플랫폼입니다. Redis Sorted Set으로 실시간 랭킹과 JWT RTR(Refresh Token Rotation)으로 보안/로그아웃 처리를 지원합니다. 최근 추가: 프런트엔드 관리자 페이지에 클라이언트 가드(로그인·ROLE_ADMIN 확인) 적용.

---

## 아키텍처 개요
- **Frontend**: Next.js(App Router), TypeScript, Tailwind, Zustand, React Query  
- **Backend**: Spring Boot 3, JPA/QueryDSL, Spring Security + JWT, Redis  
- **Infra**: MySQL 8, Redis 7, Nginx(SSL termination), Docker Compose  
- **부하 테스트**: k6 (Redis 직접 쓰기 vs Kafka 실험, Redis 채택)

서비스 흐름: Nginx → Next.js → Spring Boot API → MySQL/Redis. 시험 제출 시 동기 채점 후 Redis에 랭킹 반영, RTR 방식으로 토큰을 회전하며 Redis에 Refresh Token을 저장/검증합니다.

---

## 핵심 기능
- **시험/문항 관리**: 시리즈/회차, 공개·비공개 전환, 문항 일괄 등록·수정(시도 제출 이후에는 차단).
- **응시/채점**: 시도 시작 → 답안 저장 → 제출 시 Atomic 채점 + 점수/정답 기록.
- **랭킹**: Redis Sorted Set 기반 시험별·글로벌 제출 수 랭킹.
- **인증/보안**: JWT Access + RTR Refresh, Redis 블랙리스트 로그아웃, 관리자 전용 API, CORS 설정.
- **프런트 UX**: App Router 기반 페이지, React Query 데이터 패칭, 토스트 피드백, 관리자 라우트 가드(미인증/비관리자 리다이렉트).

---

## 빠른 시작
필수: Docker & Docker Compose

```bash
# 로컬 실행
docker-compose -f docker-compose.local.yml up -d --build

# 종료
docker-compose -f docker-compose.local.yml down
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8080  
- Swagger: http://localhost:8080/swagger-ui/index.html

---

## 환경 변수 체크포인트
- **백엔드**: `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`, `SPRING_DATA_REDIS_HOST/PORT/PASSWORD`, `JWT_SECRET`(필수, 강한 키 사용), `jwt.expiration`, `jwt.refresh-expiration`.
- **프런트**: `NEXT_PUBLIC_API_URL`(클라이언트 호출), `INTERNAL_API_URL`(Next 서버→API 리라이트). 두 값이 동일하지 않으면 API 호출이 빗나갈 수 있습니다.

---

## 운영/품질 노트
- **보안**: 관리자/사용자 권한을 API와 프런트 모두에서 체크. 토큰 검증 실패 시 401/403 처리, 로그아웃 시 Refresh Token 삭제.
- **성능**: 랭킹은 RDB 정렬 대신 Redis ZSet 사용(500ms → 5ms 수준). Kafka는 1.5k VU 기준 11% 지연 개선에 비해 복잡도·운영비가 커서 보류.
- **테스트**: JUnit5 + Mockito, k6 부하테스트 스크립트 `tests/k6/` 참고.

---

## 폴더 구조 (요약)
```
cbt-be/   # Spring Boot API 서버
cbt-fe/   # Next.js 프런트엔드
nginx/    # 리버스 프록시/SSL
docs/     # 아키텍처/벤치마크 이미지
```
