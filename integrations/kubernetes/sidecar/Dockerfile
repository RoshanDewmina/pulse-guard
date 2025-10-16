# Multi-stage build for minimal image size
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files (if you add go.mod later)
# COPY go.mod go.sum ./
# RUN go mod download

# Copy source code
COPY *.go ./

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o pulseguard-sidecar .

# Final stage: minimal runtime image
FROM alpine:latest

RUN apk --no-cache add ca-certificates curl kubectl

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/pulseguard-sidecar .

# Run as non-root user for security
RUN addgroup -g 1000 pulseguard && \
    adduser -D -u 1000 -G pulseguard pulseguard && \
    chown -R pulseguard:pulseguard /app

USER pulseguard

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pgrep -x pulseguard-sidecar || exit 1

ENTRYPOINT ["./pulseguard-sidecar"]






