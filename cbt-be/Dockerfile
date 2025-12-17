# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# 1) Gradle wrapper/설정 먼저 복사 (캐시 효율)
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle* settings.gradle* ./

RUN chmod +x ./gradlew

# (선택) 의존성 미리 받아서 캐시 레이어 만들기
# 소스 없이도 가능한 범위에서만 실행
RUN ./gradlew dependencies --no-daemon || true

# 2) 소스 복사 후 빌드
COPY . .
RUN ./gradlew bootJar --no-daemon

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# non-root 유저 생성
RUN addgroup -S app && adduser -S app -G app
USER app

# bootJar 결과물만 복사 (가급적 jar 이름 고정 권장)
COPY --from=builder /app/build/libs/*SNAPSHOT*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
