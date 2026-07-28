package app

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

func LoadConfig() Config {
	development := env("APP_ENV", "development") != "production"
	return Config{
		Addr:             ":" + env("PORT", "8788"),
		DatabasePath:     env("DB_PATH", "./data/redpanda.db"),
		SessionCookie:    env("SESSION_COOKIE", "rps_session"),
		SessionTTL:       durationEnv("SESSION_TTL", 30*24*time.Hour),
		InviteTTL:        durationEnv("INVITE_TTL", 7*24*time.Hour),
		AdminEmail:       strings.ToLower(env("ADMIN_EMAIL", "admin@redpandastudy.local")),
		AdminPassword:    env("ADMIN_PASSWORD", "RedPanda!2026"),
		PublicAppURL:     strings.TrimRight(env("PUBLIC_APP_URL", ""), "/"),
		AllowedOrigins:   splitCSV(env("ALLOWED_ORIGINS", "http://terminal.local:4173,http://localhost:4173")),
		SecureCookies:    boolEnv("SECURE_COOKIES", !development),
		CrossSiteCookies: boolEnv("CROSS_SITE_COOKIES", false),
		DevelopmentMode:  development,
	}
}

func ValidateConfig(cfg Config) error {
	if cfg.DatabasePath == "" {
		return errors.New("DB_PATH is required")
	}
	if len(cfg.AdminPassword) < 12 {
		return errors.New("ADMIN_PASSWORD must contain at least 12 characters")
	}
	if !cfg.DevelopmentMode {
		if cfg.AdminPassword == "RedPanda!2026" {
			return errors.New("set a unique ADMIN_PASSWORD in production")
		}
		if cfg.PublicAppURL == "" {
			return errors.New("PUBLIC_APP_URL is required in production")
		}
		if len(cfg.AllowedOrigins) == 0 {
			return errors.New("ALLOWED_ORIGINS is required in production")
		}
		if cfg.CrossSiteCookies && !cfg.SecureCookies {
			return errors.New("CROSS_SITE_COOKIES requires SECURE_COOKIES=true")
		}
	}
	return nil
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func durationEnv(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func boolEnv(key string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func splitCSV(value string) []string {
	var result []string
	for _, item := range strings.Split(value, ",") {
		if clean := strings.TrimSpace(item); clean != "" {
			result = append(result, clean)
		}
	}
	return result
}
