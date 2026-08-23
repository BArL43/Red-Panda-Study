FROM golang:1.24.6-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test ./...
RUN CGO_ENABLED=1 go build -trimpath -ldflags="-s -w" -o /out/red-panda-api ./cmd/server

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates wget sqlite3 \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --uid 10001 redpanda \
    && mkdir -p /data \
    && chown redpanda:redpanda /data
USER redpanda
COPY --from=build /out/red-panda-api /usr/local/bin/red-panda-api
ENV APP_ENV=production PORT=8788 DB_PATH=/data/redpanda.db
EXPOSE 8788
VOLUME ["/data"]
ENTRYPOINT ["red-panda-api"]
