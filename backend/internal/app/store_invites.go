package app

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"time"
)

func (s *Store) CreateInvitation(ctx context.Context, actorID int64, role, name, email string, ttl time.Duration, publicBaseURL string) (Invitation, string, error) {
	if role != "student" && role != "mentor" {
		return Invitation{}, "", ErrConflict
	}
	raw, err := randomToken(32)
	if err != nil {
		return Invitation{}, "", err
	}
	now := time.Now().UTC()
	expires := now.Add(ttl)
	result, err := s.db.ExecContext(ctx, `
		INSERT INTO invitations(token_hash, role, name, email, expires_at, created_by, created_at)
		VALUES(?, ?, ?, ?, ?, ?, ?)`,
		tokenHash(raw), role, cleanText(name, 100), normalizeEmail(email), formatTime(expires), actorID, formatTime(now))
	if err != nil {
		return Invitation{}, "", err
	}
	id, _ := result.LastInsertId()
	item := Invitation{
		ID:        id,
		Role:      role,
		Name:      cleanText(name, 100),
		Email:     normalizeEmail(email),
		ExpiresAt: expires,
		CreatedAt: now,
	}
	if publicBaseURL != "" {
		item.Link = publicBaseURL + "/invite?token=" + url.QueryEscape(raw)
	}
	_ = s.audit(ctx, &actorID, "invitation.created", "invitation", id, map[string]any{"role": role})
	return item, raw, nil
}

func (s *Store) InvitationByToken(ctx context.Context, raw string) (Invitation, error) {
	var item Invitation
	var used sql.NullString
	err := s.db.QueryRowContext(ctx, `
		SELECT id, role, name, email, expires_at, used_at, created_at
		FROM invitations WHERE token_hash = ?`, tokenHash(raw)).
		Scan(&item.ID, &item.Role, &item.Name, &item.Email, timeScanner{target: &item.ExpiresAt}, &used, timeScanner{target: &item.CreatedAt})
	if errors.Is(err, sql.ErrNoRows) {
		return Invitation{}, ErrNotFound
	}
	if err != nil {
		return Invitation{}, err
	}
	if used.Valid {
		value, err := parseTime(used.String)
		if err != nil {
			return Invitation{}, err
		}
		item.UsedAt = &value
		return item, ErrInviteUsed
	}
	if time.Now().UTC().After(item.ExpiresAt) {
		return item, ErrInviteExpired
	}
	return item, nil
}

func (s *Store) AcceptInvitation(ctx context.Context, raw string) (User, error) {
	now := time.Now().UTC()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return User{}, err
	}
	defer tx.Rollback()

	var invitation Invitation
	var used sql.NullString
	err = tx.QueryRowContext(ctx, `
		SELECT id, role, name, email, expires_at, used_at, created_at
		FROM invitations WHERE token_hash = ?`, tokenHash(raw)).
		Scan(&invitation.ID, &invitation.Role, &invitation.Name, &invitation.Email, timeScanner{target: &invitation.ExpiresAt}, &used, timeScanner{target: &invitation.CreatedAt})
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrNotFound
	}
	if err != nil {
		return User{}, err
	}
	if used.Valid {
		return User{}, ErrInviteUsed
	}
	if now.After(invitation.ExpiresAt) {
		return User{}, ErrInviteExpired
	}

	var existing User
	err = tx.QueryRowContext(ctx, `
		SELECT id, role, name, email, status, created_at FROM users WHERE email = ?`,
		invitation.Email).Scan(&existing.ID, &existing.Role, &existing.Name, &existing.Email, &existing.Status, timeScanner{target: &existing.CreatedAt})
	if err == nil {
		if existing.Role != invitation.Role || existing.Status != "active" {
			return User{}, ErrConflict
		}
		result, err := tx.ExecContext(ctx, `UPDATE invitations SET used_at = ? WHERE id = ? AND used_at IS NULL`, formatTime(now), invitation.ID)
		if err != nil {
			return User{}, err
		}
		affected, _ := result.RowsAffected()
		if affected != 1 {
			return User{}, ErrInviteUsed
		}
		if err := tx.Commit(); err != nil {
			return User{}, err
		}
		_ = s.audit(ctx, &existing.ID, "invitation.reaccepted", "invitation", invitation.ID, map[string]any{"role": invitation.Role})
		return existing, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return User{}, err
	}

	result, err := tx.ExecContext(ctx, `
		INSERT INTO users(role, name, email, status, created_at)
		VALUES(?, ?, ?, 'active', ?)`,
		invitation.Role, invitation.Name, invitation.Email, formatTime(now))
	if err != nil {
		return User{}, err
	}
	userID, _ := result.LastInsertId()

	if invitation.Role == "student" {
		if _, err := tx.ExecContext(ctx, `INSERT INTO student_profiles(user_id) VALUES(?)`, userID); err != nil {
			return User{}, err
		}
		result, err := tx.ExecContext(ctx, `
			INSERT INTO conversations(kind, user_id, subject, display_name, created_at, updated_at)
			VALUES('student', ?, 'Сопровождение поступления', ?, ?, ?)`,
			userID, invitation.Name, formatTime(now), formatTime(now))
		if err != nil {
			return User{}, err
		}
		conversationID, _ := result.LastInsertId()
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO messages(conversation_id, sender_type, sender_name, body, created_at)
			VALUES(?, 'system', 'Red Panda Study', ?, ?)`,
			conversationID, "Добро пожаловать! Здесь команда и наставник будут вести всю коммуникацию по вашему поступлению.", formatTime(now)); err != nil {
			return User{}, err
		}
	}

	result, err = tx.ExecContext(ctx, `UPDATE invitations SET used_at = ? WHERE id = ? AND used_at IS NULL`, formatTime(now), invitation.ID)
	if err != nil {
		return User{}, err
	}
	affected, _ := result.RowsAffected()
	if affected != 1 {
		return User{}, ErrInviteUsed
	}
	if err := tx.Commit(); err != nil {
		return User{}, err
	}
	user := User{ID: userID, Role: invitation.Role, Name: invitation.Name, Email: invitation.Email, Status: "active", CreatedAt: now}
	_ = s.audit(ctx, &userID, "invitation.accepted", "invitation", invitation.ID, map[string]any{"role": invitation.Role})
	return user, nil
}

func (s *Store) ListInvitations(ctx context.Context, publicBaseURL string) ([]Invitation, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, role, name, email, expires_at, used_at, created_at
		FROM invitations ORDER BY id DESC LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Invitation, 0)
	for rows.Next() {
		var item Invitation
		var used sql.NullString
		if err := rows.Scan(&item.ID, &item.Role, &item.Name, &item.Email, timeScanner{target: &item.ExpiresAt}, &used, timeScanner{target: &item.CreatedAt}); err != nil {
			return nil, err
		}
		if used.Valid {
			value, err := parseTime(used.String)
			if err != nil {
				return nil, err
			}
			item.UsedAt = &value
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, role, name, email, status, created_at
		FROM users WHERE role <> 'admin' ORDER BY id DESC LIMIT 300`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]User, 0)
	for rows.Next() {
		var item User
		if err := scanUser(rows, &item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) AssignMentor(ctx context.Context, actorID, mentorID, studentID int64) error {
	var mentorRole, studentRole string
	if err := s.db.QueryRowContext(ctx, `SELECT role FROM users WHERE id = ?`, mentorID).Scan(&mentorRole); err != nil {
		return ErrNotFound
	}
	if err := s.db.QueryRowContext(ctx, `SELECT role FROM users WHERE id = ?`, studentID).Scan(&studentRole); err != nil {
		return ErrNotFound
	}
	if mentorRole != "mentor" || studentRole != "student" {
		return fmt.Errorf("%w: invalid roles", ErrConflict)
	}
	now := formatTime(time.Now().UTC())
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `DELETE FROM mentor_assignments WHERE student_id = ?`, studentID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO mentor_assignments(mentor_id, student_id, created_at) VALUES(?, ?, ?)`,
		mentorID, studentID, now); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		UPDATE conversations SET assigned_to = ?, updated_at = ? WHERE kind = 'student' AND user_id = ?`,
		mentorID, now, studentID); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	return s.audit(ctx, &actorID, "mentor.assigned", "user", studentID, map[string]any{"mentor_id": mentorID})
}
