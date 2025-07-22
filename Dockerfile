FROM maven:3.8.6-eclipse-temurin-17 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

LABEL maintainer="daniladubinkin@gmail.com"
LABEL version="1.0"
LABEL description="Drone Movement Prediction Service"

COPY --from=builder /app/target/DroneMovement-*.jar app.jar

COPY src/main/resources/static /app/static

RUN addgroup --system spring && \
    adduser --system --ingroup spring spring && \
    chown -R spring:spring /app

USER spring:spring

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75 -XX:+HeapDumpOnOutOfMemoryError"

# Открываем порт
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar /app/app.jar"]