# CBT Platform (Computer Based Testing)

A modern, full-stack Computer Based Testing platform designed for creating, taking, and grading exams with real-time rankings and comprehensive analytics.

## 🚀 Key Features

*   **User Management:** Secure authentication and authorization using JWT (Access/Refresh Tokens).
*   **Exam System:**
    *   **Admin:** Create, update, and delete exams and question series.
    *   **User:** Take exams within a timed interface with auto-submission.
*   **Auto-Grading:** High-performance asynchronous grading system powered by **Apache Kafka**.
*   **Rankings:** Real-time leaderboards and score history leveraging **Redis** for speed.
*   **Analytics & Observability:**
    *   **ELK Stack:** Integrated Elasticsearch, Logstash, and Kibana for log management and advanced statistics.
    *   **Visualizations:** Interactive charts for user performance and exam statistics.
*   **Search:** Full-text search capabilities for exams and questions via Elasticsearch.

## 🛠 Tech Stack

### Backend (`cbt-be`)
*   **Language:** Java 17
*   **Framework:** Spring Boot 3.5.7
*   **Database:** 
    *   **MySQL 8.0** (Primary Relational Data)
    *   **Redis** (Caching, Session, Real-time Rankings)
    *   **Elasticsearch** (Search, Analytics, Logs)
*   **Messaging:** Apache Kafka (Async Grading, Event Driven Architecture)
*   **Security:** Spring Security + JWT
*   **Docs:** Swagger / OpenAPI

### Frontend (`cbt-fe`)
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Library:** React 19
*   **Styling:** Tailwind CSS, Tailwind Animate
*   **State Management:** Zustand, TanStack React Query
*   **Visualization:** Chart.js, React-Chartjs-2

### Infrastructure
*   **Docker Compose:** Orchestrates the entire stack including Database, Broker, Cache, Backend, and Frontend.

## 📂 Project Structure

```
CBT/
├── cbt-be/                 # Spring Boot Backend
│   ├── src/main/java/      # Source code
│   │   ├── attempt/        # Attempt & Grading logic
│   │   ├── auth/           # Authentication & JWT
│   │   ├── exam/           # Exam & Question management
│   │   ├── kafka/          # Kafka Producers/Consumers
│   │   ├── ranking/        # Redis-based Ranking service
│   │   └── statistics/     # ELK-based Statistics
│   └── build.gradle        # Backend dependencies
│
├── cbt-fe/                 # Next.js Frontend
│   ├── app/                # App Router pages (Admin, User, Auth)
│   ├── components/         # Reusable UI components
│   ├── store/              # Global state (Zustand)
│   └── lib/                # API clients & utilities
│
└── docker-compose.yml      # Full stack orchestration
```

## ⚡ Getting Started

### Option 1: Run Everything with Docker (Recommended for Demo)
You can launch the entire application (Frontend + Backend + Infrastructure) with a single command.

```bash
docker-compose up -d --build
```
*   **Frontend:** http://localhost:3000
*   **Backend:** http://localhost:8080
*   **Kibana:** http://localhost:5601

### Option 2: Local Development
Run the infrastructure in Docker, but run the backend and frontend code on your host machine for development.

#### 1. Start Infrastructure
Start only the required services (MySQL, Redis, Kafka, Elasticsearch, etc.).

```bash
docker-compose up -d db redis kafka zookeeper elasticsearch kibana
```

#### 2. Backend Setup (`cbt-be`)
1.  Navigate to the backend directory:
    ```bash
    cd cbt-be
    ```
2.  Run the Spring Boot application:
    ```bash
    ./gradlew bootRun
    ```
    *   API Docs: http://localhost:8080/swagger-ui/index.html

#### 3. Frontend Setup (`cbt-fe`)
1.  Navigate to the frontend directory:
    ```bash
    cd cbt-fe
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    *   App: http://localhost:3000

## 🧪 Testing

### Backend
Run unit and integration tests including Kafka and Benchmark tests.
```bash
cd cbt-be
./gradlew test
```

## 📝 License
This project is for educational and portfolio purposes.