package app

import (
	"context"
	"database/sql"
	"encoding/json"
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
		item.Link = publicBaseURL + "/invite#token=" + url.QueryEscape(raw)
	}
	_ = s.audit(ctx, &actorID, "invitation.created", "invitation", id, map[string]any{"role": role})
	return item, raw, nil
}

func (s *Store) RevokeInvitation(ctx context.Context, actorID, invitationID int64) error {
	result, err := s.db.ExecContext(ctx, `DELETE FROM invitations WHERE id = ? AND used_at IS NULL`, invitationID)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return ErrNotFound
	}
	_ = s.audit(ctx, &actorID, "invitation.revoked", "invitation", invitationID, map[string]any{})
	return nil
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

func (s *Store) AcceptInvitation(ctx context.Context, raw, password string, sessionTTL time.Duration) (User, string, error) {
	passwordHash, passwordSalt, err := hashPassword(password)
	if err != nil {
		return User{}, "", ErrConflict
	}
	now := time.Now().UTC()
	sessionRaw, err := randomToken(32)
	if err != nil {
		return User{}, "", err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return User{}, "", err
	}
	defer tx.Rollback()

	var invitation Invitation
	var used sql.NullString
	err = tx.QueryRowContext(ctx, `
		SELECT id, role, name, email, expires_at, used_at, created_at
		FROM invitations WHERE token_hash = ?`, tokenHash(raw)).
		Scan(&invitation.ID, &invitation.Role, &invitation.Name, &invitation.Email, timeScanner{target: &invitation.ExpiresAt}, &used, timeScanner{target: &invitation.CreatedAt})
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, "", ErrNotFound
	}
	if err != nil {
		return User{}, "", err
	}
	if used.Valid {
		return User{}, "", ErrInviteUsed
	}
	if now.After(invitation.ExpiresAt) {
		return User{}, "", ErrInviteExpired
	}

	var existing User
	err = tx.QueryRowContext(ctx, `
		SELECT id, role, name, email, status, created_at FROM users WHERE email = ?`,
		invitation.Email).Scan(&existing.ID, &existing.Role, &existing.Name, &existing.Email, &existing.Status, timeScanner{target: &existing.CreatedAt})
	if err == nil {
		if existing.Role != invitation.Role || existing.Status != "active" {
			return User{}, "", ErrConflict
		}
		// Re-accepting an invitation must also repair legacy accounts that were
		// created before profiles and private conversations became mandatory.
		if existing.Role == "student" {
			if _, err := tx.ExecContext(ctx, `INSERT OR IGNORE INTO student_profiles(user_id) VALUES(?)`, existing.ID); err != nil {
				return User{}, "", err
			}
			conversationResult, err := tx.ExecContext(ctx, `
				INSERT INTO conversations(kind, user_id, subject, status, display_name, created_at, updated_at)
				SELECT 'student', ?, 'Сопровождение поступления', 'open', ?, ?, ?
				WHERE NOT EXISTS (SELECT 1 FROM conversations WHERE kind = 'student' AND user_id = ?)`,
				existing.ID, existing.Name, formatTime(now), formatTime(now), existing.ID)
			if err != nil {
				return User{}, "", err
			}
			if created, _ := conversationResult.RowsAffected(); created == 1 {
				var conversationID int64
				if err := tx.QueryRowContext(ctx, `SELECT id FROM conversations WHERE kind = 'student' AND user_id = ?`, existing.ID).Scan(&conversationID); err != nil {
					return User{}, "", err
				}
				if _, err := tx.ExecContext(ctx, `
					INSERT INTO messages(conversation_id, sender_type, sender_name, body, created_at)
					VALUES(?, 'system', 'Red Panda Study', ?, ?)`, conversationID,
					"Добро пожаловать! Здесь команда и наставник будут вести всю коммуникацию по вашему поступлению.", formatTime(now)); err != nil {
					return User{}, "", err
				}
			}
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO portal_credentials(user_id, password_hash, password_salt, updated_at)
			VALUES(?, ?, ?, ?)
			ON CONFLICT(user_id) DO UPDATE SET
				password_hash = excluded.password_hash,
				password_salt = excluded.password_salt,
				updated_at = excluded.updated_at`,
			existing.ID, passwordHash, passwordSalt, formatTime(now)); err != nil {
			return User{}, "", err
		}
		result, err := tx.ExecContext(ctx, `UPDATE invitations SET used_at = ? WHERE id = ? AND used_at IS NULL`, formatTime(now), invitation.ID)
		if err != nil {
			return User{}, "", err
		}
		affected, _ := result.RowsAffected()
		if affected != 1 {
			return User{}, "", ErrInviteUsed
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES(?, ?, ?, ?)`,
			tokenHash(sessionRaw), existing.ID, formatTime(now.Add(sessionTTL)), formatTime(now)); err != nil {
			return User{}, "", err
		}
		if err := tx.Commit(); err != nil {
			return User{}, "", err
		}
		_ = s.audit(ctx, &existing.ID, "invitation.reaccepted", "invitation", invitation.ID, map[string]any{"role": invitation.Role})
		return existing, sessionRaw, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return User{}, "", err
	}

	result, err := tx.ExecContext(ctx, `
		INSERT INTO users(role, name, email, status, created_at)
		VALUES(?, ?, ?, 'active', ?)`,
		invitation.Role, invitation.Name, invitation.Email, formatTime(now))
	if err != nil {
		return User{}, "", err
	}
	userID, _ := result.LastInsertId()
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO portal_credentials(user_id, password_hash, password_salt, updated_at)
		VALUES(?, ?, ?, ?)`,
		userID, passwordHash, passwordSalt, formatTime(now)); err != nil {
		return User{}, "", err
	}

	if invitation.Role == "student" {
		if _, err := tx.ExecContext(ctx, `INSERT INTO student_profiles(user_id) VALUES(?)`, userID); err != nil {
			return User{}, "", err
		}
		result, err := tx.ExecContext(ctx, `
			INSERT INTO conversations(kind, user_id, subject, display_name, created_at, updated_at)
			VALUES('student', ?, 'Сопровождение поступления', ?, ?, ?)`,
			userID, invitation.Name, formatTime(now), formatTime(now))
		if err != nil {
			return User{}, "", err
		}
		conversationID, _ := result.LastInsertId()
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO messages(conversation_id, sender_type, sender_name, body, created_at)
			VALUES(?, 'system', 'Red Panda Study', ?, ?)`,
			conversationID, "Добро пожаловать! Здесь команда и наставник будут вести всю коммуникацию по вашему поступлению.", formatTime(now)); err != nil {
			return User{}, "", err
		}
	}

	result, err = tx.ExecContext(ctx, `UPDATE invitations SET used_at = ? WHERE id = ? AND used_at IS NULL`, formatTime(now), invitation.ID)
	if err != nil {
		return User{}, "", err
	}
	affected, _ := result.RowsAffected()
	if affected != 1 {
		return User{}, "", ErrInviteUsed
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES(?, ?, ?, ?)`,
		tokenHash(sessionRaw), userID, formatTime(now.Add(sessionTTL)), formatTime(now)); err != nil {
		return User{}, "", err
	}
	if err := tx.Commit(); err != nil {
		return User{}, "", err
	}
	user := User{ID: userID, Role: invitation.Role, Name: invitation.Name, Email: invitation.Email, Status: "active", CreatedAt: now}
	_ = s.audit(ctx, &userID, "invitation.accepted", "invitation", invitation.ID, map[string]any{"role": invitation.Role})
	return user, sessionRaw, nil
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
	if mentorID <= 0 || studentID <= 0 {
		return ErrNotFound
	}
	var mentorRole, mentorStatus, studentRole, studentStatus string
	if err := s.db.QueryRowContext(ctx, `SELECT role, status FROM users WHERE id = ?`, mentorID).Scan(&mentorRole, &mentorStatus); err != nil {
		return ErrNotFound
	}
	if err := s.db.QueryRowContext(ctx, `SELECT role, status FROM users WHERE id = ?`, studentID).Scan(&studentRole, &studentStatus); err != nil {
		return ErrNotFound
	}
	if mentorRole != "mentor" || studentRole != "student" || mentorStatus != "active" || studentStatus != "active" {
		return fmt.Errorf("%w: assignment requires active mentor and student accounts", ErrConflict)
	}

	now := formatTime(time.Now().UTC())
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// A student has exactly one active mentor. Reassignment is intentionally
	// idempotent and also repairs legacy duplicate rows.
	if _, err := tx.ExecContext(ctx, `DELETE FROM mentor_assignments WHERE student_id = ?`, studentID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO mentor_assignments(mentor_id, student_id, created_at) VALUES(?, ?, ?)`,
		mentorID, studentID, now); err != nil {
		return err
	}

	// Old or imported student accounts may not have a conversation yet. Create
	// it before assigning so the mentor immediately sees the student chat.
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO conversations(kind, user_id, subject, status, assigned_to, display_name, created_at, updated_at)
		SELECT 'student', u.id, 'Сопровождение поступления', 'open', ?, u.name, ?, ?
		FROM users u
		WHERE u.id = ?
		  AND NOT EXISTS (
			SELECT 1 FROM conversations c WHERE c.kind = 'student' AND c.user_id = u.id
		  )`,
		mentorID, now, now, studentID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		UPDATE conversations SET assigned_to = ?, updated_at = ? WHERE kind = 'student' AND user_id = ?`,
		mentorID, now, studentID); err != nil {
		return err
	}

	metadata, _ := json.Marshal(map[string]any{"mentor_id": mentorID})
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO audit_log(actor_user_id, action, entity_type, entity_id, metadata, created_at)
		VALUES(?, 'mentor.assigned', 'user', ?, ?, ?)`,
		actorID, studentID, string(metadata), now); err != nil {
		return err
	}
	return tx.Commit()
}
