# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o sidecar main.go

# Final stage
FROM alpine:3.18

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/sidecar .

# Create non-root user
RUN adduser -D -s /bin/sh sidecar
USER sidecar

# Default environment variables
ENV SATURN_URL=https://api.saturn.sh
ENV CHECK_INTERVAL=30
ENV TIMEOUT=300

# Run the sidecar
CMD ["./sidecar"]
