package app

import (
	"net/http"
	"strconv"
	"strings"
	"time"
)

func (s *Server) handleCreateConsultation(w http.ResponseWriter, r *http.Request) {
	if !s.allowPublic(w, r) {
		return
	}
	var input Consultation
	if !decodeJSON(w, r, &input) {
		return
	}
	input.Name = cleanText(input.Name, 100)
	input.Contact = cleanText(input.Contact, 160)
	input.Country = cleanText(input.Country, 80)
	input.Level = cleanText(input.Level, 80)
	input.Intake = cleanText(input.Intake, 80)
	input.Notes = cleanText(input.Notes, 2000)
	if input.Name == "" || input.Contact == "" || input.Country == "" || input.Level == "" || input.Intake == "" {
		writeError(w, http.StatusBadRequest, "Заполните обязательные поля")
		return
	}
	item, err := s.store.CreateConsultation(r.Context(), input)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"consultation": item, "message": "Заявка принята. Мы свяжемся с вами в рабочее время."})
}

func (s *Server) handleCohortAvailability(w http.ResponseWriter, r *http.Request) {
	const total = 16
	taken, err := s.store.CohortAvailability(r.Context())
	if err != nil {
		writeStoreError(w, err)
		return
	}
	if taken > total {
		taken = total
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"total": total, "taken": taken, "available": total - taken, "open": taken < total,
	})
}

func (s *Server) handleRecordAnnualSubscription(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireUser(w, r, "admin"); !ok {
		return
	}
	var input struct {
		Email     string `json:"email"`
		Plan      string `json:"plan"`
		Reference string `json:"reference"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	if err := s.store.RecordAnnualSubscription(r.Context(), input.Email, input.Plan, input.Reference); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleCreatePublicConversation(w http.ResponseWriter, r *http.Request) {
	if !s.allowPublic(w, r) {
		return
	}
	var input struct {
		DisplayName string `json:"display_name"`
		Subject     string `json:"subject"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	item, token, err := s.store.CreatePublicConversation(r.Context(), input.DisplayName, input.Subject)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	messages, _ := s.store.Messages(r.Context(), item.ID)
	writeJSON(w, http.StatusCreated, map[string]any{"conversation": item, "visitor_token": token, "messages": messages})
}

func (s *Server) handleGetPublicConversation(w http.ResponseWriter, r *http.Request) {
	if !s.allowPublic(w, r) {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	item, messages, err := s.store.PublicConversation(r.Context(), id, r.URL.Query().Get("token"))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"conversation": item, "messages": messages})
}

func (s *Server) handleAddPublicMessage(w http.ResponseWriter, r *http.Request) {
	if !s.allowPublic(w, r) {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var input struct {
		Token string `json:"token"`
		Body  string `json:"body"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	item, err := s.store.AddPublicMessage(r.Context(), id, input.Token, input.Body)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"message": item})
}

func (s *Server) handleGetInvitation(w http.ResponseWriter, r *http.Request) {
	if !s.allowPublic(w, r) {
		return
	}
	item, err := s.store.InvitationByToken(r.Context(), r.PathValue("token"))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"invitation": item})
}

func (s *Server) handleAcceptInvitation(w http.ResponseWriter, r *http.Request) {
	if !s.allowPublic(w, r) {
		return
	}
	user, session, err := s.store.AcceptInvitation(r.Context(), r.PathValue("token"), s.cfg.SessionTTL)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	s.setSessionCookie(w, session)
	writeJSON(w, http.StatusOK, map[string]any{"user": user, "redirect": "/" + user.Role})
}

func (s *Server) handleAdminLogin(w http.ResponseWriter, r *http.Request) {
	if !s.allowPublic(w, r) {
		return
	}
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	user, err := s.store.AuthenticateAdmin(r.Context(), input.Email, input.Password)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Неверный email или пароль")
		return
	}
	session, err := s.store.CreateSession(r.Context(), user.ID, s.cfg.SessionTTL)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	s.setSessionCookie(w, session)
	writeJSON(w, http.StatusOK, map[string]any{"user": user, "redirect": "/admin"})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(s.cfg.SessionCookie); err == nil {
		s.store.DeleteSession(r.Context(), cookie.Value)
	}
	s.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin", "student", "mentor")
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleAdminOverview(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin")
	if !ok {
		return
	}
	counts, err := s.store.AdminCounts(r.Context())
	if err != nil {
		writeStoreError(w, err)
		return
	}
	consultations, err := s.store.ListConsultations(r.Context())
	if err != nil {
		writeStoreError(w, err)
		return
	}
	users, err := s.store.ListUsers(r.Context())
	if err != nil {
		writeStoreError(w, err)
		return
	}
	invitations, err := s.store.ListInvitations(r.Context(), "")
	if err != nil {
		writeStoreError(w, err)
		return
	}
	conversations, err := s.store.ListConversations(r.Context(), user)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"counts": counts, "consultations": consultations, "users": users,
		"invitations": invitations, "conversations": conversations,
	})
}

func (s *Server) handleCreateInvitation(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin")
	if !ok {
		return
	}
	var input struct {
		Role  string `json:"role"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	if !strings.Contains(input.Email, "@") || cleanText(input.Name, 100) == "" {
		writeError(w, http.StatusBadRequest, "Укажите имя и корректный email")
		return
	}
	baseURL := s.cfg.PublicAppURL
	if baseURL == "" {
		baseURL = publicBaseURL(r)
	}
	item, token, err := s.store.CreateInvitation(r.Context(), user.ID, input.Role, input.Name, input.Email, s.cfg.InviteTTL, baseURL)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	item.Link = baseURL + "/invite?token=" + token
	writeJSON(w, http.StatusCreated, map[string]any{"invitation": item})
}

func (s *Server) handleAssignMentor(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin")
	if !ok {
		return
	}
	var input struct {
		MentorID  int64 `json:"mentor_id"`
		StudentID int64 `json:"student_id"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	if err := s.store.AssignMentor(r.Context(), user.ID, input.MentorID, input.StudentID); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleUpdateConsultation(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin")
	if !ok {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var input struct {
		Status string `json:"status"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	if err := s.store.UpdateConsultationStatus(r.Context(), user.ID, id, input.Status); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleListConversations(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin", "student", "mentor")
	if !ok {
		return
	}
	items, err := s.store.ListConversations(r.Context(), user)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"conversations": items})
}

func (s *Server) handleGetConversation(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin", "student", "mentor")
	if !ok {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	item, messages, err := s.store.ConversationForUser(r.Context(), user, id)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"conversation": item, "messages": messages})
}

func (s *Server) handleAddAuthenticatedMessage(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin", "student", "mentor")
	if !ok {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var input struct {
		Body string `json:"body"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	item, err := s.store.AddAuthenticatedMessage(r.Context(), user, id, input.Body)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"message": item})
}

func (s *Server) handleStudentDashboard(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "student")
	if !ok {
		return
	}
	item, err := s.store.StudentDashboard(r.Context(), user.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"dashboard": item})
}

func (s *Server) handleUpdateStudentProfile(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin", "student", "mentor")
	if !ok {
		return
	}
	studentID, ok := pathID(w, r)
	if !ok {
		return
	}
	var input StudentProfile
	if !decodeJSON(w, r, &input) {
		return
	}
	if err := s.store.UpdateStudentProfile(r.Context(), user, studentID, input); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleMentorStudents(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "mentor")
	if !ok {
		return
	}
	items, err := s.store.MentorStudents(r.Context(), user.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"students": items})
}

func (s *Server) handleCreateTask(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin", "mentor")
	if !ok {
		return
	}
	var input struct {
		StudentID   int64  `json:"student_id"`
		Title       string `json:"title"`
		Description string `json:"description"`
		DueAt       string `json:"due_at"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	var dueAt *time.Time
	if input.DueAt != "" {
		parsed, err := time.Parse("2006-01-02", input.DueAt)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Некорректная дата")
			return
		}
		dueAt = &parsed
	}
	item, err := s.store.CreateTask(r.Context(), user, input.StudentID, input.Title, input.Description, dueAt)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"task": item})
}

func (s *Server) handleUpdateTask(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireUser(w, r, "admin", "mentor", "student")
	if !ok {
		return
	}
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var input struct {
		Status string `json:"status"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	if err := s.store.UpdateTaskStatus(r.Context(), user, id, input.Status); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func parsePositiveID(value string) (int64, bool) {
	id, err := strconv.ParseInt(value, 10, 64)
	return id, err == nil && id > 0
}
