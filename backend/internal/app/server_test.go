package app

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strconv"
	"testing"
	"time"
)

type testAPI struct {
	t      *testing.T
	server *httptest.Server
	admin  *http.Client
	cfg    Config
}

func newTestAPI(t *testing.T) *testAPI {
	t.Helper()
	cfg := Config{
		DatabasePath:   filepath.Join(t.TempDir(), "test.db"),
		SessionCookie:  "rps_test_session",
		SessionTTL:     time.Hour,
		InviteTTL:      time.Hour,
		AdminEmail:     "admin@example.test",
		AdminPassword:  "StrongPassword!2026",
		AllowedOrigins: nil,
		SecureCookies:  false,
	}
	store, err := OpenStore(cfg.DatabasePath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { store.Close() })
	if _, err := store.SeedAdmin(t.Context(), cfg.AdminEmail, cfg.AdminPassword); err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(NewServer(cfg, store))
	t.Cleanup(server.Close)
	jar, _ := cookiejar.New(nil)
	return &testAPI{t: t, server: server, admin: &http.Client{Jar: jar}, cfg: cfg}
}

func (a *testAPI) client() *http.Client {
	jar, _ := cookiejar.New(nil)
	return &http.Client{Jar: jar}
}

func (a *testAPI) request(client *http.Client, method, path string, body any, expected int) map[string]any {
	a.t.Helper()
	var encoded []byte
	if body != nil {
		var err error
		encoded, err = json.Marshal(body)
		if err != nil {
			a.t.Fatal(err)
		}
	}
	req, err := http.NewRequest(method, a.server.URL+path, bytes.NewReader(encoded))
	if err != nil {
		a.t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	response, err := client.Do(req)
	if err != nil {
		a.t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != expected {
		var failure map[string]any
		_ = json.NewDecoder(response.Body).Decode(&failure)
		a.t.Fatalf("%s %s: got %d, want %d (%v)", method, path, response.StatusCode, expected, failure)
	}
	if response.StatusCode == http.StatusNoContent {
		return nil
	}
	var result map[string]any
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		a.t.Fatal(err)
	}
	return result
}

func (a *testAPI) loginAdmin() {
	a.request(a.admin, http.MethodPost, "/api/v1/admin/login", map[string]any{
		"password": a.cfg.AdminPassword,
	}, http.StatusOK)
}

func (a *testAPI) invitation(role, name, email string) string {
	result := a.request(a.admin, http.MethodPost, "/api/v1/admin/invitations", map[string]any{
		"role": role, "name": name, "email": email,
	}, http.StatusCreated)
	item := result["invitation"].(map[string]any)
	link, err := url.Parse(item["link"].(string))
	if err != nil {
		a.t.Fatal(err)
	}
	return link.Query().Get("token")
}

func (a *testAPI) accept(client *http.Client, token string) map[string]any {
	return a.request(client, http.MethodPost, "/api/v1/invitations/"+url.PathEscape(token)+"/accept", map[string]any{}, http.StatusOK)
}

func TestCompleteServiceFlowAndRoleBoundaries(t *testing.T) {
	api := newTestAPI(t)
	api.request(api.admin, http.MethodGet, "/api/health", nil, http.StatusOK)
	api.request(api.admin, http.MethodPost, "/api/v1/consultations", map[string]any{
		"name": "Мария", "contact": "@maria", "country": "Китай",
		"level": "Бакалавриат", "intake": "2027", "notes": "",
	}, http.StatusCreated)

	api.loginAdmin()
	overview := api.request(api.admin, http.MethodGet, "/api/v1/admin/overview", nil, http.StatusOK)
	counts := overview["counts"].(map[string]any)
	if counts["new_consultations"].(float64) != 1 {
		t.Fatalf("consultation not visible in admin overview: %v", counts)
	}

	studentClient := api.client()
	studentToken := api.invitation("student", "Мария Ли", "student@example.test")
	student := api.accept(studentClient, studentToken)["user"].(map[string]any)
	studentID := int64(student["id"].(float64))
	api.request(api.client(), http.MethodPost, "/api/v1/invitations/"+url.PathEscape(studentToken)+"/accept", map[string]any{}, http.StatusGone)

	mentorClient := api.client()
	mentorToken := api.invitation("mentor", "Антон Вэй", "mentor@example.test")
	mentor := api.accept(mentorClient, mentorToken)["user"].(map[string]any)
	mentorID := int64(mentor["id"].(float64))

	api.request(api.admin, http.MethodPost, "/api/v1/admin/assignments", map[string]any{
		"mentor_id": mentorID, "student_id": studentID,
	}, http.StatusNoContent)

	mentorStudents := api.request(mentorClient, http.MethodGet, "/api/v1/mentor/students", nil, http.StatusOK)
	if len(mentorStudents["students"].([]any)) != 1 {
		t.Fatalf("assigned student is not visible to mentor: %v", mentorStudents)
	}
	api.request(mentorClient, http.MethodGet, "/api/v1/student/dashboard", nil, http.StatusForbidden)

	task := api.request(mentorClient, http.MethodPost, "/api/v1/tasks", map[string]any{
		"student_id": studentID, "title": "Черновик эссе",
		"description": "Подготовить первый вариант", "due_at": "2026-09-10",
	}, http.StatusCreated)["task"].(map[string]any)
	taskID := int64(task["id"].(float64))

	dashboard := api.request(studentClient, http.MethodGet, "/api/v1/student/dashboard", nil, http.StatusOK)
	tasks := dashboard["dashboard"].(map[string]any)["tasks"].([]any)
	if len(tasks) != 1 {
		t.Fatalf("mentor task is not visible to student: %v", dashboard)
	}
	api.request(studentClient, http.MethodPatch, "/api/v1/tasks/"+strconv.FormatInt(taskID, 10), map[string]any{"status": "done"}, http.StatusNoContent)
	api.request(studentClient, http.MethodGet, "/api/v1/admin/overview", nil, http.StatusForbidden)
}

func TestPublicChatPersistsAndAdminReplies(t *testing.T) {
	api := newTestAPI(t)
	api.loginAdmin()
	visitor := api.client()
	created := api.request(visitor, http.MethodPost, "/api/v1/chat/conversations", map[string]any{
		"display_name": "Гость", "subject": "Стоимость сопровождения",
	}, http.StatusCreated)
	conversation := created["conversation"].(map[string]any)
	id := int64(conversation["id"].(float64))
	token := created["visitor_token"].(string)

	api.request(visitor, http.MethodPost, "/api/v1/chat/conversations/"+strconv.FormatInt(id, 10)+"/messages", map[string]any{
		"token": token, "body": "Сколько стоит пакет?",
	}, http.StatusCreated)
	api.request(api.admin, http.MethodPost, "/api/v1/conversations/"+strconv.FormatInt(id, 10)+"/messages", map[string]any{
		"body": "Пакеты начинаются от 45 000 ₽.",
	}, http.StatusCreated)

	thread := api.request(visitor, http.MethodGet, "/api/v1/chat/conversations/"+strconv.FormatInt(id, 10)+"?token="+url.QueryEscape(token), nil, http.StatusOK)
	if len(thread["messages"].([]any)) != 3 {
		t.Fatalf("expected system, visitor and admin messages: %v", thread)
	}
	api.request(visitor, http.MethodGet, "/api/v1/chat/conversations/"+strconv.FormatInt(id, 10)+"?token=wrong", nil, http.StatusForbidden)
}

func TestCrossSiteCookiesRequireSecureTransport(t *testing.T) {
	cfg := Config{
		DatabasePath:     "test.db",
		AdminPassword:    "StrongPassword!2026",
		PublicAppURL:     "https://frontend.example",
		AllowedOrigins:   []string{"https://frontend.example"},
		CrossSiteCookies: true,
		SecureCookies:    false,
		DevelopmentMode:  false,
	}
	if err := ValidateConfig(cfg); err == nil {
		t.Fatal("expected production config to reject insecure cross-site cookies")
	}
	cfg.SecureCookies = true
	if err := ValidateConfig(cfg); err != nil {
		t.Fatalf("expected valid production config, got %v", err)
	}
}
