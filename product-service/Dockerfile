# Use a GoLang base image for compilation
FROM golang:1.24-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy the Go module files
COPY go.mod .
# COPY go.sum .

# Download Go modules
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the Go application
# CGO_ENABLED=0 disables CGO, which makes the binary statically linked
# -o product-service specifies the output binary name
# -ldflags="-s -w" reduces the binary size
RUN CGO_ENABLED=0 go build -o product-service -ldflags="-s -w" ./main.go

# Stage 2: Production image
# Use a minimal base image for the final production binary
FROM alpine:latest

# Set the working directory
WORKDIR /app

# ** NEW: Install curl for health checks **
RUN apk add --no-cache curl

# Copy the compiled binary from the builder stage
COPY --from=builder /app/product-service .

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["./product-service"]