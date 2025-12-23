# 🚀 CBT (Computer Based Test) Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**데이터 기반의 의사결정과 성능 최적화에 집중한 현대적인 온라인 시험 플랫폼입니다.**  
복잡한 시험 프로세스(출제-응시-채점-결과 분석)를 안정적으로 처리하며, Redis를 활용한 실시간 순위 산정 시스템을 구축했습니다.

---

## 🌟 Key Technical Features

### 1. 실시간 랭킹 및 성능 최적화 (Redis)
*   **High Performance:** RDB의 `ORDER BY` 부하를 줄이기 위해 **Redis Sorted Set**을 도입, **O(log N)**의 시간 복잡도로 실시간 순위를 산정합니다.
*   **Efficient Caching:** 반복적인 시험 메타데이터 조회를 캐싱하여 DB I/O를 최소화했습니다.

### 2. 보안 및 인증 아키텍처 (JWT & Spring Security)
*   **Stateless Auth:** 서버 확장성을 위해 세션 대신 **JWT (Access/Refresh Token)** 기반 인증을 구현했습니다.
*   **Token Management:** Refresh Token을 Redis에 저장하고 TTL을 설정하여, 보안성과 로그아웃 처리를 효율적으로 해결했습니다.
*   **RBAC:** Role-Based Access Control을 통해 관리자와 일반 사용자의 접근 권한을 엄격히 분리했습니다.

### 3. 고효율 데이터 모델링 (JPA)
*   **N+1 Problem Solved:** `Fetch Join`과 `@EntityGraph`를 활용하여 연관된 문제/선지 데이터를 단 1회의 쿼리로 조회하도록 최적화했습니다.
*   **Atomic Grading:** 트랜잭션 관리를 통해 채점과 점수 반영이 원자적으로 수행되도록 설계하여 데이터 정합성을 보장합니다.

### 4. 인프라 자동화 (Docker & CI/CD)
*   **Containerization:** MySQL, Redis, App, Nginx를 **Docker Compose**로 오케스트레이션하여 개발과 운영 환경의 일치성을 확보했습니다.
*   **Reverse Proxy:** Nginx를 활용한 리버스 프록시 설정으로 내부 보안을 강화했습니다.

---

## 🛠 Tech Stack

### Backend
*   **Core:** Java 17, Spring Boot 3.x
*   **Persistence:** JPA (Hibernate), MySQL 8.0
*   **Cache/Store:** **Redis**
*   **Security:** Spring Security, JWT
*   **API Docs:** Swagger (SpringDoc)

### Frontend
*   **Framework:** **Next.js 16** (App Router)
*   **State:** Zustand, React Query
*   **Styling:** Tailwind CSS, Shadcn UI
*   **Visual:** Chart.js

---

## 📂 Project Structure

```bash
CBT/
├── cbt-be/               # Spring Boot Backend
│   └── src/main/java/com/example/cbt/
│       ├── attempt/      # 응시 및 채점 로직 (Grading Service)
│       ├── auth/         # JWT 기반 인증 및 보안 설정
│       ├── exam/         # 시험 및 문항 관리
│       ├── ranking/      # Redis 기반 실시간 랭킹 서비스
│       └── common/aop/   # 공통 로깅 및 관심사 분리(AOP)
├── cbt-fe/               # Next.js Frontend (TypeScript)
└── nginx/                # Reverse Proxy Configuration
```

---

## ⚡ Getting Started

### Prerequisites
*   Docker & Docker Compose

### Fast Run (Docker Compose)
모든 환경(DB, Redis, BE, FE)을 한 번에 실행합니다.
```bash
docker-compose up -d --build
```
*   **Frontend:** `http://localhost:3000`
*   **Backend API:** `http://localhost:8080`
*   **API Documentation:** `http://localhost:8080/swagger-ui/index.html`

---

## 📊 Architecture Decision
본 프로젝트는 무분별한 기술 도입보다 **데이터 기반의 의사결정**을 지향합니다.  
Kafka 도입과 직접 DB 접근 방식에 대한 레이턴시 벤치마크 결과는 [PORTFOLIO.md](./PORTFOLIO.md)에서 확인할 수 있습니다.