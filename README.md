# CBT · 온라인 CBT 플랫폼

이 프로젝트는 개인 응시 중심의 온라인 CBT(Computer Based Test) 플랫폼 서비스입니다. Next.js(App Router)와 Spring Boot 3 기반으로 구성되어 있으며, Redis ZSet 랭킹과 JWT RTR(Refresh Token Rotation)로 성능과 보안을 강화했습니다.

## 핵심 기능
- 시험/문항 관리: 시리즈/회차 구성, 공개/비공개 전환, 문항 일괄 등록
- 응시/채점: 응시 시작 -> 답안 저장 -> 제출 시 원자적 채점 및 기록
- 랭킹: Redis Sorted Set 기반 시험별/글로벌 랭킹
- 인증/보안: JWT Access + RTR Refresh, Redis 블랙리스트 로그아웃
- 공개 상세 페이지: 시험 상세/문항 미리보기/랭킹/관련 시험 노출

## 아키텍처 개요
- 흐름: Nginx -> Next.js -> Spring Boot API -> MySQL/Redis
- FE는 `/api` 경로를 통해 BE로 프록시(rewrite)
- BE는 제출 시 동기 채점 후 Redis 랭킹 반영

## 빠른 시작
### 로컬 개발
Backend:
```bash
cd cbt-be
./gradlew bootRun
```
Frontend:
```bash
cd cbt-fe
npm install
npm run dev
```
- FE: http://localhost:3000
- BE: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html

### Docker Compose (운영 구성)
`docker-compose.yml`은 SSL 종단(Nginx)과 도메인(`hyunul.shop`)을 전제로 설정되어 있습니다. 로컬에서 그대로 사용하려면 인증서/도메인 설정을 맞추거나 Nginx 설정을 조정해야 합니다.

```bash
docker-compose up -d --build
```

## 환경 변수 체크포인트
Backend:
- `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`
- `SPRING_DATA_REDIS_HOST/PORT/PASSWORD`
- `JWT_SECRET` (필수)
- `jwt.expiration`, `jwt.refresh-expiration`

Frontend:
- `NEXT_PUBLIC_API_URL` (클라이언트 호출)
- `INTERNAL_API_URL` (Next 서버에서 BE로 리라이트)

## 폴더 구조 (요약)
```
cbt-be/   # Spring Boot API 서버
cbt-fe/   # Next.js 프런트엔드
nginx/    # 리버스 프록시/SSL
docs/     # 아키텍처/벤치마크 이미지
```