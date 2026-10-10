# Spring Boot 빌드
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

COPY . .

RUN chmod +x gradlew
RUN ./gradlew clean bootJar --no-daemon


# Spring Boot + Python 실행 환경
FROM eclipse-temurin:21-jre

WORKDIR /app

# Python 및 폰트 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
        fonts-noto-cjk \
        fonts-nanum \
        fontconfig && \
    rm -rf /var/lib/apt/lists/*

# 프로젝트의 한글 TTF를 시스템 폰트로 등록
COPY src/main/resources/fonts/NanumGothic.ttf \
    /usr/local/share/fonts/jakupsil/NanumGothic.ttf

COPY src/main/resources/fonts/NanumGothicBold.ttf \
    /usr/local/share/fonts/jakupsil/NanumGothicBold.ttf

RUN fc-cache -fv && \
    fc-list :lang=ko

# Python 의존성 설치
COPY python/requirements.txt /app/python/requirements.txt

RUN python3 -m venv /app/python/.venv && \
    /app/python/.venv/bin/pip install --no-cache-dir \
        -r /app/python/requirements.txt

# Python 변환 스크립트
COPY python/convertDocxToPdf.py /app/python/convertDocxToPdf.py

# Spring Boot JAR
COPY --from=build /app/build/libs/jakupsil.jar app.jar

# Python 실행 경로
ENV PYTHON_EXECUTABLE=/app/python/.venv/bin/python
ENV PYTHON_SCRIPT=/app/python/convertDocxToPdf.py

EXPOSE 8080

CMD ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-8080}"]