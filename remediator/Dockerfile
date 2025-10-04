# ---- Build stage ----
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod ./
RUN go mod download

COPY . .
RUN go build -o remediator main.go

# ---- Runtime stage ----
FROM alpine:3.18

WORKDIR /app
COPY --from=builder /app/remediator .

# Needed for Docker CLI
RUN apk add --no-cache docker-cli

EXPOSE 9095
CMD ["./remediator"]
