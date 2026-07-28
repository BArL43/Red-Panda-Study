package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"redpandastudy/backend/internal/app"
)

func main() {
	cfg := app.LoadConfig()
	if err := app.ValidateConfig(cfg); err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}
	store, err := app.OpenStore(cfg.DatabasePath)
	if err != nil {
		slog.Error("open database", "error", err)
		os.Exit(1)
	}
	defer store.Close()

	admin, err := store.SeedAdmin(context.Background(), cfg.AdminEmail, cfg.AdminPassword)
	if err != nil {
		slog.Error("seed admin", "error", err)
		os.Exit(1)
	}
	if cfg.DevelopmentMode {
		slog.Info("development admin ready", "email", admin.Email)
	}

	server := &http.Server{
		Addr:              cfg.Addr,
		Handler:           app.NewServer(cfg, store),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       20 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       90 * time.Second,
	}
	go func() {
		slog.Info("API listening", "addr", cfg.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	<-signals

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		slog.Error("graceful shutdown failed", "error", err)
	}
}
