# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle* settings.gradle* ./

# 소스 복사 전에 권한 부여(캐시용) + 이후 덮어쓰기 대비해서 다시 한번 부여할 예정
RUN chmod +x ./gradlew

# (선택) 캐시 레이어
RUN ./gradlew dependencies --no-daemon || true

# 전체 소스 복사 (여기서 gradlew가 다시 덮일 수 있음)
COPY . .

# 덮어쓴 gradlew에 다시 실행 권한 부여 (핵심)
RUN chmod +x ./gradlew

RUN ./gradlew bootJar --no-daemon

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
