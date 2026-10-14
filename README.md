# CBT Exam Platform

시리즈별 시험 관리, 게스트·회원 응시, 자동 저장, 채점, 결과 리뷰와 랭킹을 제공하는 웹 애플리케이션입니다.

## 구성

| 영역 | 기술 / 역할 |
| --- | --- |
| cbt-fe | Next.js 16, React 19, TypeScript, Zustand, Tailwind CSS 4 |
| cbt-be | Java 17, Spring Boot 3.5, Spring Security, JPA, Flyway |
| MySQL 8 | 시험·응시·답안과 랭킹의 기준 데이터 |
| Redis 7 | 활성 로그인 세션, Refresh Token 회전, 일회용 OAuth 코드 |
| Nginx | 같은 출처의 API/OAuth 라우팅, 요청 제한 |

랭킹은 자격증 종목(시리즈)별 풀이 횟수입니다. 공개된 필기 시험의 제출 완료 응시를 비회원 포함으로 세고 실기는 제외하며, 동점이면 종목 ID 순으로 정렬합니다. DB의 확정된 기록에서 계산하므로 Redis 장애나 중복 제출로 이중 집계되지 않습니다. 대규모 트래픽 성능을 측정한 프로젝트는 아닙니다.

## 실행

1. `.env.example`을 `.env`로 복사합니다.
2. DB 비밀번호 2개와 JWT 키를 서로 다른 임의 값으로 변경합니다. JWT 키는 최소 32바이트입니다.
3. `docker compose up -d --build --wait`를 실행합니다.
4. `http://localhost`를 엽니다.

Docker Desktop 또는 Docker Engine + Compose가 필요합니다. 빈 DB는 Flyway가 생성합니다. 기존 DB는 [운영 문서](docs/OPERATIONS.md)의 마이그레이션 절차를 먼저 확인하세요. DB·Redis는 호스트 포트로 공개하지 않습니다.

프론트엔드 개발: `cd cbt-fe`, `npm ci`, `npm run dev`.
API는 같은 출처의 `/api`를 사용하며 개발 서버가 localhost:8080으로 전달합니다. `INTERNAL_API_URL`로 전달할 백엔드를 지정할 수 있습니다. `NEXT_PUBLIC_API_URL`은 외부 API 직접 호출이 필요할 때만 빌드 전에 지정합니다.

백엔드 개발: Java 17, MySQL, Redis를 준비하고 `JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD` 및 DB/Redis 연결 환경변수를 설정한 뒤 `cbt-be`에서 `./gradlew bootRun`을 실행합니다. Windows는 `gradlew.bat`을 사용합니다. 직접 실행 시 Spring Boot는 루트 `.env`를 자동으로 읽지 않습니다.

## 검증

```sh
cd cbt-be
./gradlew test bootJar
cd ../cbt-fe
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run audit
```

백엔드 기본 테스트는 독립 H2 DB와 test 프로파일을 사용합니다. 프론트엔드는 API 오류·동시 토큰 갱신·게스트 키·답안 복원·타이머를 검증합니다. CI 검사 통과 후 커밋 SHA로 이미지를 빌드하고 배포합니다.

실제 MySQL·Redis 통합 검증은 임시 환경 파일의 `HTTP_PORT=18080`, `FRONTEND_URL=http://localhost:18080` 설정과 `cbt-validation-` 접두사의 Compose 프로젝트를 사용합니다. 운영 DB에서 실행하지 않습니다.

```sh
docker compose --env-file /path/to/test.env -p cbt-validation-local up -d --build --wait
python scripts/smoke_test.py --env-file /path/to/test.env --project cbt-validation-local
docker compose --env-file /path/to/test.env -p cbt-validation-local down --volumes
```

통합 검증은 역할 상승 차단, 비공개 시험 접근 차단, 게스트 소유권, 답안 복원, 동시 제출, 랭킹, 토큰 회전 경쟁과 로그아웃을 확인합니다. CI에서도 같은 검증을 실행합니다.

## 동작 규칙

- 시험은 비공개로 생성하고 유효한 문항을 저장한 후 공개합니다.
- 응시가 하나라도 시작되면 문항 교체를 금지합니다. 제한시간은 응시 시작 시 보관합니다.
- 회원 응시는 소유자만, 게스트 응시는 시작한 브라우저의 비밀키로만 접근합니다.
- 서버 마감 이후 답안 변경은 거절합니다. 늦은 제출은 마감 전에 저장된 답안만 채점합니다.
- 제출과 최종 답안 저장은 하나의 트랜잭션입니다. 동시 제출은 잠금으로 직렬화하고 재제출은 같은 결과를 반환합니다.
- 주관식은 쉼표로 구분된 허용 답 중 하나와 앞뒤 공백 제거 후 대소문자 무시 완전 일치로 채점합니다.
- 응시가 있는 시험의 일반 삭제는 거절합니다. 관리자 시리즈 강제 삭제는 시험·응시·답안 전체를 삭제하므로 별도 확인이 필요합니다.
- 사용자별 활성 로그인 세션은 하나입니다. 새 로그인과 로그아웃은 이전 토큰을 무효화합니다.
- OAuth는 설정된 공급자만 표시하고 토큰 대신 60초 일회용 코드를 전달합니다.

[운영·마이그레이션·HTTPS·OAuth](docs/OPERATIONS.md) / [구현 설명](PORTFOLIO.md)
