# Stage 1: Builder
# Compiles the Go code into WASM
FROM golang:1.24 AS builder

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY main.go build.sh ./
COPY internal ./internal

# Build WASM binary
# This also copies the correct wasm_exec.js for this Go version
RUN chmod +x build.sh && ./build.sh

# Stage 2: Demo Runner
# Lightweight Node.js environment to run examples
FROM node:18-alpine

WORKDIR /app

# Copy compiled artifacts from builder
COPY --from=builder /app/bin /app/bin

# Copy project files needed for examples
COPY package.json ./
# We need dist/index.js for the library wrapper
COPY dist ./dist
# Copy all examples
COPY examples ./examples

# Install only production dependencies (none currently, but good practice)
# We might need 'http-server' to serve the browser demo easily
RUN npm install -g http-server

# Expose port for the browser demo
EXPOSE 8080

# Default Command: Show usage menu
COPY examples/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
