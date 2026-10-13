# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle* settings.gradle* ./

RUN chmod +x ./gradlew

# Resolve dependency metadata before copying application sources.
RUN ./gradlew dependencies --configuration runtimeClasspath --no-daemon --quiet > /dev/null

COPY . .

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
