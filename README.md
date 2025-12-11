# CBT Platform (Computer Based Testing)

A modern, full-stack Computer Based Testing platform designed for creating, taking, and grading exams with real-time rankings.

## 🚀 Key Features

*   **User Management:** Secure authentication and authorization using JWT.
*   **Exam System:**
    *   **Admin:** Create and manage exams with various question types.
    *   **User:** Take exams within a timed interface.
*   **Auto-Grading:** Asynchronous grading system powered by Kafka.
*   **Rankings:** Real-time leaderboards and score history using Redis and Kafka.
*   **Data Visualization:** Interactive charts for exam statistics and history.
*   **Observability:** Integrated ELK Stack (Elasticsearch, Logstash, Kibana) for logging and monitoring.

## 🛠 Tech Stack

### Backend (`cbt-be`)
*   **Language:** Java 17
*   **Framework:** Spring Boot 3.5.7
*   **Database:** MySQL (Primary), Redis (Caching & Leaderboards)
*   **Messaging:** Apache Kafka (Async Processing)
*   **Security:** Spring Security + JWT
*   **Documentation:** Swagger/OpenAPI

### Frontend (`cbt-fe`)
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand (Client), TanStack React Query (Server)
*   **Charts:** Chart.js

### Infrastructure
*   **Docker Compose:** Orchestrates dependencies (Redis, Kafka, Zookeeper, ELK).

## 📋 Prerequisites

Ensure you have the following installed:
*   **Java 17+**
*   **Node.js 18+** (LTS recommended)
*   **Docker & Docker Compose**
*   **MySQL Server** (Local instance)

## ⚡ Getting Started

### 1. Infrastructure Setup
Start the required services (Redis, Kafka, Zookeeper, ElasticSearch, Kibana) using Docker Compose.

> **Note:** The `docker-compose.yml` includes a PostgreSQL container, but the application is currently configured for MySQL. We will only start the dependencies.

```bash
cd cbt-be
docker-compose up -d redis kafka zookeeper elasticsearch kibana
```

### 2. Backend Setup (`cbt-be`)

1.  **Database Configuration:**
    Ensure your local MySQL server is running and create a database named `cbt`.
    
    Check `src/main/resources/application.yml` and update the credentials if necessary:
    ```yaml
    spring:
      datasource:
        url: jdbc:mysql://localhost:3306/cbt...
        username: root
        password: 1234 # Update this to your MySQL password
    ```

2.  **Run the Application:**
    ```bash
    ./gradlew bootRun
    ```
    The backend API will be available at `http://localhost:8080`.
    Swagger UI documentation: `http://localhost:8080/swagger-ui/index.html`

### 3. Frontend Setup (`cbt-fe`)

1.  **Install Dependencies:**
    ```bash
    cd ../cbt-fe
    npm install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:3000`.

## 📂 Project Structure

```
├── cbt-be/                 # Spring Boot Backend
│   ├── src/main/java/      # Source code
│   │   ├── attempt/        # Attempt & Answer logic
│   │   ├── auth/           # Authentication (JWT)
│   │   ├── exam/           # Exam management
│   │   ├── kafka/          # Kafka consumers/producers
│   │   └── ranking/        # Leaderboard logic
│   └── docker-compose.yml  # Infrastructure definition
│
├── cbt-fe/                 # Next.js Frontend
│   ├── app/                # App Router pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── exam/           # Exam taking interface
│   │   └── ranking/        # Leaderboard page
│   ├── components/         # Reusable UI components
│   └── store/              # Zustand state stores
```
