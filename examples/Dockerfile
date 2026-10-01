# Both stages use Debian Bookworm so Node has matching system libraries.
FROM node:26.3.0-bookworm-slim AS node-runtime
FROM golang:1.24.4-bookworm AS builder

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
ENV GOTOOLCHAIN=go1.24.4 GOMAXPROCS=2 GOFLAGS=-p=2
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY main.go build.sh package.json ./
COPY scripts ./scripts
COPY internal ./internal
RUN bash ./build.sh

FROM node-runtime AS demo
WORKDIR /app
# Runtime artifacts come from this build, never the checkout's dist or bin.
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY LICENSE ./LICENSE
COPY examples ./examples
COPY examples/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
