export const generateDockerfile = ({
    projectType,
    version,
    installCommand,
    buildCommand,
    startCommand,
}) => {

    switch (projectType) {

        case "static":
            return `
FROM node:${version} AS builder

WORKDIR /app

COPY package*.json ./

RUN ${installCommand || "npm ci"}

COPY . .

ARG BUILD_CMD
ARG VITE_ENV_CONTENT

RUN echo "$VITE_ENV_CONTENT" > .env

RUN if [ -n "$BUILD_CMD" ]; then sh -c "$BUILD_CMD"; else ${buildCommand || "npm run build"}; fi
`;

        case "node":
            return `
FROM node:${version}-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

FROM node:${version}-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG APP_PORT=3000
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

ARG START_CMD="${startCommand || "node index.js"}"
ENV START_CMD=$START_CMD

CMD ["sh", "-c", "$START_CMD"]
`;

        case "python":
            return `
FROM python:${version} AS builder

WORKDIR /app

COPY requirements.txt .

RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

FROM python:${version}-slim

WORKDIR /app

COPY --from=builder /install /usr/local

COPY . .

ARG APP_PORT=8000
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

ARG START_CMD="${startCommand || "python app.py"}"
ENV START_CMD=$START_CMD

CMD ["sh", "-c", "$START_CMD"]
`;

        case "go":
            return `
FROM golang:${version} AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux ${buildCommand || "go build -o app ."}

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/app .

ARG APP_PORT=8080
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

ARG START_CMD="${startCommand || "./app"}"
ENV START_CMD=$START_CMD

CMD ["sh", "-c", "$START_CMD"]
`;

        case "java":
            return `
FROM maven:3.9-eclipse-temurin-${version} AS builder

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY . .

RUN ${buildCommand || "mvn clean package -DskipTests"}

FROM eclipse-temurin:${version}-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

ARG APP_PORT=8080
ENV PORT=$APP_PORT

EXPOSE $APP_PORT

ARG START_CMD="${"java -jar app.jar"}"
ENV START_CMD=$START_CMD

CMD ["sh", "-c", "$START_CMD"]
`;

        default:
            throw new Error(
                `Unsupported project type: ${projectType}`
            );
    }

};