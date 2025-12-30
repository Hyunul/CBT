# 📝 CBT Platform (Computer Based Testing)

대규모 트래픽 처리를 고려하여 설계된 **온라인 시험 및 자동 채점 플랫폼**입니다.  
Spring Boot와 Next.js로 구축되었으며, **Kafka를 활용한 비동기 랭킹 처리**를 통해 시험 종료 직전 발생하는 대량의 트래픽(Traffic Burst)을 안정적으로 처리하는 데 초점을 맞췄습니다.

---

## 🛠 Tech Stack

| Category | Technology |
| --- | --- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Spring Boot 3.x, Java 17, Spring Security (JWT) |
| **Database** | MySQL 8.0, JPA (Hibernate) |
| **Cache & Store** | Redis (Ranking, Session), MySQL (Persistent Data) |
| **Message Queue** | Apache Kafka, Zookeeper (비동기 채점/랭킹 처리) |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions |
| **Testing** | k6 (Load Testing), JUnit 5 |

---

## 🚀 Getting Started

이 프로젝트는 **로컬 개발 환경(Local)**과 **운영 환경(Production)**을 위한 Docker 설정이 분리되어 있습니다.

### 1. 사전 준비 (Prerequisites)
*   [Docker](https://www.docker.com/) & Docker Compose 설치
*   (선택) Java 17, Node.js 18+ (소스 코드 직접 실행 시)

### 2. 간편 실행 (Docker Compose) - 추천

백엔드, 프론트엔드, DB, Redis, Kafka를 한 번에 실행합니다.

**로컬 개발 모드 (Local Development)**
*   DB, Redis, Kafka 포트가 호스트에 노출되어 디버깅이 용이합니다.
*   Frontend: `http://localhost:3000`
*   Backend: `http://localhost:8080`

```bash
# 실행
docker-compose -f docker-compose.local.yml up -d --build

# 종료
docker-compose -f docker-compose.local.yml down
```

**운영 모드 (Production)**
*   Nginx가 앞단에 붙어 SSL(HTTPS) 및 리버스 프록시를 처리합니다.
*   Certbot을 통한 SSL 자동 갱신이 포함되어 있습니다.

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## ⚙️ Configuration & Ports

| Service | Port (Local) | Description |
| --- | --- | --- |
| **Frontend** | `3000` | Next.js Web Client |
| **Backend** | `8080` | Spring Boot API Server |
| **MySQL** | `3307` (Internal: 3306) | Main Database (`cbt_platform`) |
| **Redis** | `6379` | Cache & Ranking ZSet |
| **Kafka** | `9093` (Internal: 9092) | Event Streaming |

### 환경 변수 설정
`docker-compose.local.yml` 내부 `environment` 섹션에서 주요 설정을 변경할 수 있습니다.

*   `SPRING_DATASOURCE_PASSWORD`: DB 비밀번호 (기본값: `root_password` 또는 `1234`)
*   `APP_FEATURE_RANKING_ASYNC`: 랭킹 처리 방식 토글 (`true`: Kafka 비동기, `false`: Redis 동기)

---

## 🧪 Performance & Load Testing (Kafka 도입 검증)

이 프로젝트는 **"동시 접속자가 몇 명일 때 Kafka가 필요한가?"** 를 증명하기 위한 부하 테스트 시나리오를 포함합니다.

### 랭킹 처리 아키텍처 비교
1.  **Sync (동기 방식)**: 시험 제출 즉시 Redis에 점수 업데이트 (`APP_FEATURE_RANKING_ASYNC=false`)
2.  **Async (비동기 방식)**: Kafka에 이벤트를 발행하고 즉시 응답, 컨슈머가 백그라운드 처리 (`APP_FEATURE_RANKING_ASYNC=true`)

### 부하 테스트 실행 (k6)
k6를 사용하여 가상 유저(VU) 300명이 동시에 시험을 제출하는 상황을 시뮬레이션합니다.

```bash
# 1. 테스트 스크립트가 있는 폴더로 이동 (또는 Docker 볼륨 마운트 사용)
# Docker를 이용한 실행 예시:
docker run --rm -i \
  -v ${PWD}/tests/k6:/scripts \
  grafana/k6 run /scripts/load_test.js
```

---

## 📂 Project Structure

```
CBT/
├── cbt-be/              # Spring Boot Backend
│   └── src/main/java/   # API, Domain Logic, Event Listeners
├── cbt-fe/              # Next.js Frontend
│   └── app/             # App Router Pages
├── nginx/               # Nginx Configuration (Prod/Local)
├── tests/k6/            # Load Testing Scripts
├── docker-compose.local.yml  # Local Dev Setup
└── docker-compose.prod.yml   # Production Setup
```

## 🛡 License
This project is for educational and portfolio purposes.
