FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY . .
RUN ./gradlew bootJar
ENTRYPOINT ["java", "-jar", "build/libs/cbt-0.0.1-SNAPSHOT.jar"]
