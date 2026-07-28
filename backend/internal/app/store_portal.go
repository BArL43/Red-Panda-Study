package app

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

func (s *Store) StudentDashboard(ctx context.Context, studentID int64) (StudentSummary, error) {
	var result StudentSummary
	err := s.db.QueryRowContext(ctx, `
		SELECT u.id, u.role, u.name, u.email, u.status, u.created_at,
		       p.user_id, p.country, p.level, p.intake, p.progress
		FROM users u JOIN student_profiles p ON p.user_id = u.id
		WHERE u.id = ? AND u.role = 'student'`, studentID).
		Scan(&result.User.ID, &result.User.Role, &result.User.Name, &result.User.Email, &result.User.Status, timeScanner{target: &result.User.CreatedAt},
			&result.Profile.UserID, &result.Profile.Country, &result.Profile.Level, &result.Profile.Intake, &result.Profile.Progress)
	if errors.Is(err, sql.ErrNoRows) {
		return StudentSummary{}, ErrNotFound
	}
	if err != nil {
		return StudentSummary{}, err
	}

	var mentor User
	err = s.db.QueryRowContext(ctx, `
		SELECT u.id, u.role, u.name, u.email, u.status, u.created_at
		FROM mentor_assignments ma JOIN users u ON u.id = ma.mentor_id
		WHERE ma.student_id = ? LIMIT 1`, studentID).
		Scan(&mentor.ID, &mentor.Role, &mentor.Name, &mentor.Email, &mentor.Status, timeScanner{target: &mentor.CreatedAt})
	if err == nil {
		result.Mentor = &mentor
	} else if !errors.Is(err, sql.ErrNoRows) {
		return StudentSummary{}, err
	}

	tasks, err := s.TasksForStudent(ctx, studentID)
	if err != nil {
		return StudentSummary{}, err
	}
	result.Tasks = tasks
	var conversationID int64
	err = s.db.QueryRowContext(ctx, `SELECT id FROM conversations WHERE kind = 'student' AND user_id = ? LIMIT 1`, studentID).Scan(&conversationID)
	if err == nil {
		conversation, err := s.conversationByID(ctx, conversationID)
		if err != nil {
			return StudentSummary{}, err
		}
		result.Conversation = &conversation
	} else if !errors.Is(err, sql.ErrNoRows) {
		return StudentSummary{}, err
	}
	return result, nil
}

func (s *Store) TasksForStudent(ctx context.Context, studentID int64) ([]Task, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, student_id, assigned_by, title, description, status, due_at, created_at
		FROM tasks WHERE student_id = ? ORDER BY
		  CASE status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
		  due_at IS NULL, due_at ASC, id DESC`, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Task, 0)
	for rows.Next() {
		var item Task
		var due sql.NullString
		if err := rows.Scan(&item.ID, &item.StudentID, &item.AssignedBy, &item.Title, &item.Description, &item.Status, &due, timeScanner{target: &item.CreatedAt}); err != nil {
			return nil, err
		}
		if due.Valid {
			value, err := parseTime(due.String)
			if err != nil {
				return nil, err
			}
			item.DueAt = &value
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) MentorStudents(ctx context.Context, mentorID int64) ([]MentorStudent, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT u.id, u.role, u.name, u.email, u.status, u.created_at,
		       p.user_id, p.country, p.level, p.intake, p.progress,
		       COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.student_id = u.id AND t.status <> 'done'), 0)
		FROM mentor_assignments ma
		JOIN users u ON u.id = ma.student_id
		JOIN student_profiles p ON p.user_id = u.id
		WHERE ma.mentor_id = ?
		ORDER BY u.name`, mentorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]MentorStudent, 0)
	for rows.Next() {
		var item MentorStudent
		if err := rows.Scan(
			&item.User.ID, &item.User.Role, &item.User.Name, &item.User.Email, &item.User.Status, timeScanner{target: &item.User.CreatedAt},
			&item.Profile.UserID, &item.Profile.Country, &item.Profile.Level, &item.Profile.Intake, &item.Profile.Progress, &item.OpenTasks,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateTask(ctx context.Context, actor SessionUser, studentID int64, title, description string, dueAt *time.Time) (Task, error) {
	if actor.Role == "mentor" {
		var count int
		if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM mentor_assignments WHERE mentor_id = ? AND student_id = ?`, actor.ID, studentID).Scan(&count); err != nil {
			return Task{}, err
		}
		if count == 0 {
			return Task{}, ErrForbidden
		}
	} else if actor.Role != "admin" {
		return Task{}, ErrForbidden
	}
	title = cleanText(title, 180)
	if title == "" {
		return Task{}, ErrConflict
	}
	now := time.Now().UTC()
	var due any
	if dueAt != nil {
		due = formatTime(*dueAt)
	}
	result, err := s.db.ExecContext(ctx, `
		INSERT INTO tasks(student_id, assigned_by, title, description, status, due_at, created_at)
		VALUES(?, ?, ?, ?, 'todo', ?, ?)`,
		studentID, actor.ID, title, cleanText(description, 3000), due, formatTime(now))
	if err != nil {
		return Task{}, err
	}
	id, _ := result.LastInsertId()
	item := Task{ID: id, StudentID: studentID, AssignedBy: actor.ID, Title: title, Description: cleanText(description, 3000), Status: "todo", DueAt: dueAt, CreatedAt: now}
	_ = s.audit(ctx, &actor.ID, "task.created", "task", id, map[string]any{"student_id": studentID})
	return item, nil
}

func (s *Store) UpdateTaskStatus(ctx context.Context, actor SessionUser, taskID int64, status string) error {
	if status != "todo" && status != "in_progress" && status != "done" {
		return ErrConflict
	}
	var studentID int64
	if err := s.db.QueryRowContext(ctx, `SELECT student_id FROM tasks WHERE id = ?`, taskID).Scan(&studentID); errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	if actor.Role == "student" && actor.ID != studentID {
		return ErrForbidden
	}
	if actor.Role == "mentor" {
		var count int
		if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM mentor_assignments WHERE mentor_id = ? AND student_id = ?`, actor.ID, studentID).Scan(&count); err != nil {
			return err
		}
		if count == 0 {
			return ErrForbidden
		}
	}
	if actor.Role != "admin" && actor.Role != "mentor" && actor.Role != "student" {
		return ErrForbidden
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE tasks SET status = ? WHERE id = ?`, status, taskID); err != nil {
		return err
	}
	return s.audit(ctx, &actor.ID, "task.status_changed", "task", taskID, map[string]any{"status": status})
}

func (s *Store) UpdateStudentProfile(ctx context.Context, actor SessionUser, studentID int64, profile StudentProfile) error {
	if actor.Role == "student" && actor.ID != studentID {
		return ErrForbidden
	}
	if actor.Role == "mentor" {
		var count int
		if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM mentor_assignments WHERE mentor_id = ? AND student_id = ?`, actor.ID, studentID).Scan(&count); err != nil {
			return err
		}
		if count == 0 {
			return ErrForbidden
		}
	}
	if actor.Role != "admin" && actor.Role != "mentor" && actor.Role != "student" {
		return ErrForbidden
	}
	if profile.Progress < 0 || profile.Progress > 100 {
		return ErrConflict
	}
	result, err := s.db.ExecContext(ctx, `
		UPDATE student_profiles SET country = ?, level = ?, intake = ?, progress = ? WHERE user_id = ?`,
		cleanText(profile.Country, 80), cleanText(profile.Level, 80), cleanText(profile.Intake, 80), profile.Progress, studentID)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return ErrNotFound
	}
	return s.audit(ctx, &actor.ID, "student.profile_updated", "user", studentID, map[string]any{"progress": profile.Progress})
}

func (s *Store) AdminCounts(ctx context.Context) (map[string]int, error) {
	result := map[string]int{}
	queries := map[string]string{
		"new_consultations": `SELECT COUNT(*) FROM consultations WHERE status = 'new'`,
		"students":          `SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active'`,
		"mentors":           `SELECT COUNT(*) FROM users WHERE role = 'mentor' AND status = 'active'`,
		"open_chats":        `SELECT COUNT(*) FROM conversations WHERE status = 'open'`,
	}
	for key, query := range queries {
		var count int
		if err := s.db.QueryRowContext(ctx, query).Scan(&count); err != nil {
			return nil, err
		}
		result[key] = count
	}
	return result, nil
}
