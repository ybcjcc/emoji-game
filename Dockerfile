# 前端构建阶段
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 后端构建阶段
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add --no-cache gcc musl-dev

RUN CGO_ENABLED=1 GOOS=linux go build -o main .

# 最终阶段
FROM alpine:latest
WORKDIR /app
COPY --from=frontend-builder /app/dist ./static
COPY --from=backend-builder /app/main .
COPY backend/emoji.db .

EXPOSE 8080
CMD ["./main"] 