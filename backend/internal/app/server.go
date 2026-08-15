package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Server struct {
	cfg     Config
	store   *Store
	limiter *ipLimiter
}

func NewServer(cfg Config, store *Store) http.Handler {
	server := &Server{cfg: cfg, store: store, limiter: newIPLimiter(80, 10*time.Minute)}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", server.handleHealth)
	mux.HandleFunc("POST /api/v1/consultations", server.handleCreateConsultation)
	mux.HandleFunc("GET /api/v1/cohort", server.handleCohortAvailability)
	mux.HandleFunc("POST /api/v1/chat/conversations", server.handleCreatePublicConversation)
	mux.HandleFunc("GET /api/v1/chat/conversations/{id}", server.handleGetPublicConversation)
	mux.HandleFunc("POST /api/v1/chat/conversations/{id}/messages", server.handleAddPublicMessage)
	mux.HandleFunc("GET /api/v1/invitations/{token}", server.handleGetInvitation)
	mux.HandleFunc("POST /api/v1/invitations/{token}/accept", server.handleAcceptInvitation)
	mux.HandleFunc("POST /api/v1/admin/login", server.handleAdminLogin)
	mux.HandleFunc("POST /api/v1/logout", server.handleLogout)
	mux.HandleFunc("GET /api/v1/me", server.handleMe)

	mux.HandleFunc("GET /api/v1/admin/overview", server.handleAdminOverview)
	mux.HandleFunc("POST /api/v1/admin/invitations", server.handleCreateInvitation)
	mux.HandleFunc("POST /api/v1/admin/assignments", server.handleAssignMentor)
	mux.HandleFunc("PATCH /api/v1/admin/consultations/{id}", server.handleUpdateConsultation)
	mux.HandleFunc("POST /api/v1/admin/subscriptions", server.handleRecordAnnualSubscription)

	mux.HandleFunc("GET /api/v1/conversations", server.handleListConversations)
	mux.HandleFunc("GET /api/v1/conversations/{id}", server.handleGetConversation)
	mux.HandleFunc("POST /api/v1/conversations/{id}/messages", server.handleAddAuthenticatedMessage)

	mux.HandleFunc("GET /api/v1/student/dashboard", server.handleStudentDashboard)
	mux.HandleFunc("PATCH /api/v1/students/{id}/profile", server.handleUpdateStudentProfile)
	mux.HandleFunc("GET /api/v1/mentor/students", server.handleMentorStudents)
	mux.HandleFunc("POST /api/v1/tasks", server.handleCreateTask)
	mux.HandleFunc("PATCH /api/v1/tasks/{id}", server.handleUpdateTask)

	return server.recover(server.securityHeaders(server.corsAndOrigin(mux)))
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	status := http.StatusOK
	databaseReady := s.store.Ready(r.Context()) == nil
	if !databaseReady {
		status = http.StatusServiceUnavailable
	}
	commit := strings.TrimSpace(os.Getenv("RENDER_GIT_COMMIT"))
	if commit == "" {
		commit = "unknown"
	}
	writeJSON(w, status, map[string]any{"status": map[bool]string{true: "ok", false: "degraded"}[databaseReady], "service": "red-panda-study-api", "database_ready": databaseReady, "commit": commit, "time": time.Now().UTC()})
}

func (s *Server) recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				slog.Error("request panic", "error", recovered, "path", r.URL.Path)
				writeError(w, http.StatusInternalServerError, "Внутренняя ошибка сервера")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (s *Server) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

func (s *Server) corsAndOrigin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && s.originAllowed(origin, r) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
			w.Header().Add("Vary", "Origin")
		}
		if r.Method == http.MethodOptions {
			if origin != "" && !s.originAllowed(origin, r) {
				writeError(w, http.StatusForbidden, "Источник запроса не разрешён")
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead && origin != "" && !s.originAllowed(origin, r) {
			writeError(w, http.StatusForbidden, "Источник запроса не разрешён")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) originAllowed(origin string, r *http.Request) bool {
	for _, allowed := range s.cfg.AllowedOrigins {
		if strings.EqualFold(strings.TrimRight(origin, "/"), strings.TrimRight(allowed, "/")) {
			return true
		}
	}
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	return strings.EqualFold(strings.TrimRight(origin, "/"), scheme+"://"+r.Host)
}

func (s *Server) currentUser(r *http.Request) (SessionUser, error) {
	cookie, err := r.Cookie(s.cfg.SessionCookie)
	if err != nil || cookie.Value == "" {
		return SessionUser{}, ErrForbidden
	}
	return s.store.SessionUser(r.Context(), cookie.Value)
}

func (s *Server) requireUser(w http.ResponseWriter, r *http.Request, roles ...string) (SessionUser, bool) {
	user, err := s.currentUser(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Требуется авторизация")
		return SessionUser{}, false
	}
	for _, role := range roles {
		if user.Role == role {
			return user, true
		}
	}
	writeError(w, http.StatusForbidden, "Недостаточно прав")
	return SessionUser{}, false
}

func (s *Server) setSessionCookie(w http.ResponseWriter, raw string) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.cfg.SessionCookie,
		Value:    raw,
		Path:     "/",
		MaxAge:   int(s.cfg.SessionTTL.Seconds()),
		Expires:  time.Now().UTC().Add(s.cfg.SessionTTL),
		HttpOnly: true,
		SameSite: s.sessionSameSite(),
		Secure:   s.cfg.SecureCookies,
	})
}

func (s *Server) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.cfg.SessionCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Unix(1, 0).UTC(),
		HttpOnly: true,
		SameSite: s.sessionSameSite(),
		Secure:   s.cfg.SecureCookies,
	})
}

func (s *Server) sessionSameSite() http.SameSite {
	if s.cfg.CrossSiteCookies {
		return http.SameSiteNoneMode
	}
	return http.SameSiteLaxMode
}

func (s *Server) allowPublic(w http.ResponseWriter, r *http.Request) bool {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	if forwarded := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-For"), ",")[0]); forwarded != "" {
		host = forwarded
	}
	if !s.limiter.Allow(host) {
		w.Header().Set("Retry-After", "600")
		writeError(w, http.StatusTooManyRequests, "Слишком много запросов. Попробуйте позже")
		return false
	}
	return true
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeError(w, http.StatusBadRequest, "Проверьте заполнение полей")
		return false
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, "Тело запроса должно содержать один JSON-объект")
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]any{"error": message})
}

func writeStoreError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "Запись не найдена")
	case errors.Is(err, ErrForbidden):
		writeError(w, http.StatusForbidden, "Недостаточно прав")
	case errors.Is(err, ErrInviteUsed):
		writeError(w, http.StatusGone, "Приглашение уже использовано")
	case errors.Is(err, ErrInviteExpired):
		writeError(w, http.StatusGone, "Срок приглашения истёк")
	case errors.Is(err, ErrConflict):
		writeError(w, http.StatusConflict, "Данные конфликтуют с текущим состоянием")
	default:
		slog.Error("store operation failed", "error", err)
		writeError(w, http.StatusInternalServerError, "Не удалось выполнить операцию")
	}
}

func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	value, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || value <= 0 {
		writeError(w, http.StatusBadRequest, "Некорректный идентификатор")
		return 0, false
	}
	return value, true
}

func publicBaseURL(r *http.Request) string {
	scheme := r.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
		if r.TLS != nil {
			scheme = "https"
		}
	}
	host := r.Header.Get("X-Forwarded-Host")
	if host == "" {
		host = r.Host
	}
	return fmt.Sprintf("%s://%s", scheme, host)
}

type ipWindow struct {
	start time.Time
	count int
}

type ipLimiter struct {
	mu     sync.Mutex
	items  map[string]ipWindow
	limit  int
	window time.Duration
}

func newIPLimiter(limit int, window time.Duration) *ipLimiter {
	return &ipLimiter{items: make(map[string]ipWindow), limit: limit, window: window}
}

func (l *ipLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	if len(l.items) > 2_000 {
		for candidate, window := range l.items {
			if now.Sub(window.start) >= l.window {
				delete(l.items, candidate)
			}
		}
	}
	item := l.items[key]
	if item.start.IsZero() || now.Sub(item.start) >= l.window {
		l.items[key] = ipWindow{start: now, count: 1}
		return true
	}
	if item.count >= l.limit {
		return false
	}
	item.count++
	l.items[key] = item
	return true
}
