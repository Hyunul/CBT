# CBT Exam Platform

개인 학습 및 응시를 위한 고성능 온라인 CBT(Computer Based Test) 플랫폼입니다.
최신 기술 스택(Next.js 16, Spring Boot 3.5, React 19)을 적용하여 개발되었으며, 대용량 트래픽 처리를 고려한 설계(Redis 랭킹, 비동기 처리 가능 구조)와 보안(JWT RTR)을 갖추고 있습니다.

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Core:** Next.js 16.0.7 (App Router), React 19.2.0, TypeScript
- **State & Fetching:** Zustand, React Query (@tanstack/react-query)
- **Styling:** Tailwind CSS 4, Lucide React
- **Visualization:** Chart.js, React-Chartjs-2

### Backend
- **Core:** Java 17, Spring Boot 3.5.7
- **Database:** Spring Data JPA (MySQL 8.0), Spring Data Redis (Redis 7)
- **Security:** Spring Security, JWT (with Refresh Token Rotation)
- **Docs:** SpringDoc OpenAPI (Swagger)

### Infrastructure
- **Container:** Docker, Docker Compose
- **Proxy:** Nginx (Reverse Proxy, SSL termination ready)

## ✨ 핵심 기능 (Key Features)

1.  **시험 및 문항 관리**
    - 시리즈(Series) 및 회차(Exam) 계층 구조 관리
    - 문항 일괄 등록 및 공개/비공개 설정
    - 관리자 전용 대시보드 제공

2.  **실시간 응시 및 채점**
    - 타이머 및 답안 자동 저장
    - 제출 시 원자적(Atomic) 채점 프로세스
    - 정오답 노트 및 해설 확인

3.  **실시간 랭킹 시스템**
    - Redis Sorted Set(ZSet)을 활용한 고성능 랭킹 산출
    - 시험별, 전체 랭킹 조회 및 내 순위 확인

4.  **보안 및 인증**
    - JWT Access Token + Refresh Token Rotation (RTR) 방식
    - Redis 블랙리스트 기반 로그아웃 처리
    - Role 기반 권한 관리 (ADMIN, USER)

## 🚀 시작하기 (Getting Started)

### 사전 요구 사항 (Prerequisites)
- Java 17+
- Node.js 20+
- Docker & Docker Compose (선택)

### 1. 로컬 개발 환경 (Local Development)

**Backend:**
```bash
cd cbt-be
# 의존성 설치 및 실행
./gradlew bootRun
```
* 서버는 `http://localhost:8080`에서 실행됩니다.
* Swagger 문서: `http://localhost:8080/swagger-ui/index.html`

**Frontend:**
```bash
cd cbt-fe
npm install
npm run dev
```
* 클라이언트는 `http://localhost:3000`에서 실행됩니다.

### 2. 도커 기반 실행 (Docker Compose)
프로젝트 전체를 컨테이너로 실행합니다. Nginx, MySQL, Redis가 자동으로 설정됩니다.

```bash
docker-compose up -d --build
```
* 서비스 접속: `http://localhost` (Nginx 포트 80)

## 📂 폴더 구조 (Project Structure)

```
CBT/
├── cbt-be/            # Spring Boot Backend source
├── cbt-fe/            # Next.js Frontend source
├── nginx/             # Nginx configuration
├── docker-compose.yml # Container orchestration config
└── docs/              # Documentation & assets
```