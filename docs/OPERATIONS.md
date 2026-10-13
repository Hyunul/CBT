# 운영과 마이그레이션

## 기존 설치 업그레이드

1. DB 백업과 복구 절차를 확인하고 진행 중 응시를 종료한 뒤 유지보수 창에서 작업합니다.
2. 이전 설정에 들어 있던 JWT 키·DB 비밀번호·OAuth 비밀값을 교체합니다. 현재 파일에서 제거해도 Git 이력에는 남을 수 있습니다. 컨테이너 환경변수 변경만으로 기존 MySQL 사용자의 암호가 바뀌지는 않으므로 DBA가 암호 변경과 앱 계정 권한을 별도로 적용해야 합니다.
3. 기존 DB가 V1 스키마와 일치하는지 확인합니다. `flyway_schema_history`가 없는 검증된 기존 설치만 baseline version 1을 설정합니다. 빈 DB에는 baseline을 사용하지 않습니다.
4. 기존 `answers(attempt_id, question_id)`와 `users(provider, provider_id)` 중복을 검토해 정리합니다. V2는 중복 데이터를 임의로 삭제하지 않고 실패합니다.
5. 기존 설치에 한해 다음 명령으로 한 번만 baseline을 적용합니다. 영구 환경변수로 남기지 않습니다.

```sh
docker compose run --rm -e SPRING_FLYWAY_BASELINE_ON_MIGRATE=true -e SPRING_FLYWAY_BASELINE_VERSION=1 backend
```

기동 성공을 확인하고 종료한 뒤 일반 `docker compose up -d --wait`로 전환합니다. 신규 DB는 V1 → V2가 자동 적용됩니다. 운영 Hibernate는 `ddl-auto: validate`로 스키마를 검증만 합니다.

기존 JWT는 재로그인이 필요합니다. 비밀키가 없던 과거 게스트 응시는 더 이상 공개 조회를 허용하지 않으므로 새 응시를 시작해야 합니다. 회원 이력은 보존됩니다. V2는 기존 응시의 제한시간을 해당 시험의 현재 값에서 복사합니다.

## 관리자 초기 설정

일반 가입 후 신뢰할 수 있는 DB 관리 경로에서 정확한 계정 하나에만 권한을 부여하고 재로그인합니다.

```sql
UPDATE users SET role = 'ROLE_ADMIN' WHERE username = '관리자로 지정할 정확한 아이디';
```

관리자 메뉴 숨김은 편의 기능이며 권한 검증은 서버가 수행합니다.

## HTTPS와 배포

기본 Compose는 로컬 개발용 HTTP입니다. 운영은 인증서를 준비하고 `.env`에 `FRONTEND_URL=https://서비스도메인`, `TLS_CERTIFICATE`, `TLS_PRIVATE_KEY`의 절대 경로를 설정합니다.

```sh
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build --wait
```

EC2 자동 배포에서도 HTTPS 구성을 쓰려면 서버 `.env`에 `COMPOSE_FILE=docker-compose.yml:docker-compose.https.yml`을 설정합니다. Linux 경로 구분자는 콜론입니다. TLS는 Nginx에서 종료하며 HTTP는 HTTPS로 전환합니다. 별도 로드밸런서에서 TLS를 종료한다면 신뢰한 프록시만 원본에 접근하게 제한하고 전달 헤더를 환경에 맞춰야 합니다. 외부의 임의 `X-Forwarded-Proto`를 그대로 신뢰하지 않습니다.

배포 전에 서버 Docker 레지스트리 로그인, `.env`, GitHub production environment 보호 규칙과 Docker/EC2 secrets를 준비합니다. 롤백은 이전 커밋 SHA를 `IMAGE_TAG`로 지정합니다. 스키마 변경은 이미지 롤백과 별개이므로 백업 복구 계획이 필요합니다.

Nginx는 Docker DNS를 주기적으로 조회해 재생성된 앱 컨테이너의 주소를 반영합니다. 수동 배포에서 Nginx 설정 파일을 수정했다면 `docker compose exec -T nginx nginx -t`로 검사한 후 `docker compose exec -T nginx nginx -s reload`를 실행합니다. 자동 배포는 이 단계를 포함합니다.

## OAuth

사용하는 공급자의 자격증명과 프로파일만 설정합니다.

```dotenv
SPRING_PROFILES_ACTIVE=prod,oauth-google
GOOGLE_CLIENT_ID=발급받은값
GOOGLE_CLIENT_SECRET=발급받은값
FRONTEND_URL=https://서비스도메인
```

콜백은 `https://서비스도메인/login/oauth2/code/google`입니다. Kakao/Naver는 마지막 경로, 프로파일, 환경변수 접두사를 해당 공급자로 바꿉니다. 설정하지 않은 공급자는 로그인 화면에 표시하지 않습니다. 실계정 로그인 검증에는 유효한 자격증명과 등록된 콜백이 필요합니다.

이메일이 같다는 이유로 계정을 자동 연결하지 않습니다. 이미 사용 중인 이메일이면 기존 로그인 방식을 사용해야 합니다. 계정 연결 기능은 별도의 본인 확인이 필요합니다.

## 요청과 데이터 정책

게스트 키는 브라우저 localStorage에, 서버에는 SHA-256 해시만 저장합니다. 브라우저 저장소 삭제 시 해당 응시 접근 권한도 사라집니다. 회원 토큰도 브라우저에 저장하므로 사용자 입력 HTML을 실행하지 않아야 합니다.

Nginx 인증 요청 제한은 초당 5회, 응시 시작은 초당 1회이며 버스트를 허용합니다. 학교·학원 등 공유 NAT 환경에서는 사용량에 맞춰 조정하세요. DB·Redis는 내부 네트워크에만 노출됩니다.

Redis 장애 시 인증은 실패 처리합니다. 게스트 응시·채점과 랭킹은 MySQL을 사용합니다. 랭킹은 캐시와 DB 사이의 이중 쓰기가 없습니다.

## 의존성 검사 범위

`npm run audit`는 개발 도구를 포함한 전체 의존성을 검사하며 low 이상 경고가 있으면 CI를 실패시킵니다. Tailwind 4와 전용 PostCSS 플러그인을 사용하여 Tailwind 3의 취약한 glob·selector 파서 경로를 제거했습니다. 지원 브라우저 기준은 Safari 16.4+, Chrome 111+, Firefox 128+입니다.

Next ESLint 16.4.0의 `fast-glob`에는 수정 릴리스가 없는 `braces`가 포함되므로, 해당 플러그인의 검색 의존성을 `tools/next-root-glob` 로컬 어댑터로 override했습니다. 어댑터는 `tinyglobby@0.2.17`을 사용하고 단일 디렉터리와 glob의 처리 차이를 보정합니다. 플러그인이 사용하는 `globSync(pattern, { onlyDirectories: true })`를 실제 교체하며 Next 린트 규칙은 유지합니다. 회귀 테스트는 단일 디렉터리·문자열·배열·중괄호·Windows 경로의 디렉터리 검색과 Next 린트 규칙 실행을 확인합니다. 플러그인 업그레이드 시 사용 API를 재확인하고, 상위 패키지가 취약 의존성을 제거하면 override도 제거합니다.

참고: [braces 보안 공지](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [Tailwind 4 이전 안내](https://tailwindcss.com/docs/upgrade-guide).
