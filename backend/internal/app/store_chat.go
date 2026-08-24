package app

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

func (s *Store) CreatePublicConversation(ctx context.Context, displayName, subject string) (Conversation, string, error) {
	raw, err := randomToken(32)
	if err != nil {
		return Conversation{}, "", err
	}
	now := time.Now().UTC()
	name := cleanText(displayName, 80)
	if name == "" {
		name = "Гость"
	}
	subject = cleanText(subject, 140)
	if subject == "" {
		subject = "Вопрос о поступлении"
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Conversation{}, "", err
	}
	defer tx.Rollback()
	result, err := tx.ExecContext(ctx, `
		INSERT INTO conversations(kind, visitor_token_hash, subject, display_name, created_at, updated_at)
		VALUES('public', ?, ?, ?, ?, ?)`,
		tokenHash(raw), subject, name, formatTime(now), formatTime(now))
	if err != nil {
		return Conversation{}, "", err
	}
	id, _ := result.LastInsertId()
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO messages(conversation_id, sender_type, sender_name, body, created_at)
		VALUES(?, 'system', 'Red Panda Study', ?, ?)`,
		id, "Здравствуйте! Напишите вопрос — команда увидит сообщение в админ-панели и ответит здесь.", formatTime(now)); err != nil {
		return Conversation{}, "", err
	}
	if err := tx.Commit(); err != nil {
		return Conversation{}, "", err
	}
	item := Conversation{ID: id, Kind: "public", Subject: subject, Status: "open", DisplayName: name, UpdatedAt: now}
	_ = s.audit(ctx, nil, "conversation.created", "conversation", id, map[string]any{"kind": "public"})
	return item, raw, nil
}

func (s *Store) publicConversationAllowed(ctx context.Context, id int64, raw string) error {
	var expected string
	err := s.db.QueryRowContext(ctx, `
		SELECT visitor_token_hash FROM conversations WHERE id = ? AND kind = 'public'`, id).Scan(&expected)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if !constantStringEqual(expected, tokenHash(raw)) {
		return ErrForbidden
	}
	return nil
}

func (s *Store) PublicConversation(ctx context.Context, id int64, raw string, afterID int64) (Conversation, MessagePage, error) {
	if err := s.publicConversationAllowed(ctx, id, raw); err != nil {
		return Conversation{}, MessagePage{}, err
	}
	item, err := s.conversationByID(ctx, id)
	if err != nil {
		return Conversation{}, MessagePage{}, err
	}
	page, err := s.MessagesPage(ctx, id, afterID)
	return item, page, err
}

func (s *Store) AddPublicMessage(ctx context.Context, id int64, raw, body string) (Message, error) {
	if err := s.publicConversationAllowed(ctx, id, raw); err != nil {
		return Message{}, err
	}
	item, err := s.conversationByID(ctx, id)
	if err != nil {
		return Message{}, err
	}
	return s.insertMessage(ctx, id, "visitor", nil, item.DisplayName, body)
}

func (s *Store) AddAuthenticatedMessage(ctx context.Context, user SessionUser, conversationID int64, body string) (Message, error) {
	item, err := s.conversationByID(ctx, conversationID)
	if err != nil {
		return Message{}, err
	}
	if user.Role == "student" && (item.UserID == nil || *item.UserID != user.ID) {
		return Message{}, ErrForbidden
	}
	if user.Role == "mentor" {
		if item.AssignedTo == nil || *item.AssignedTo != user.ID {
			return Message{}, ErrForbidden
		}
	}
	if user.Role != "admin" && user.Role != "student" && user.Role != "mentor" {
		return Message{}, ErrForbidden
	}
	return s.insertMessage(ctx, conversationID, user.Role, &user.ID, user.Name, body)
}

func (s *Store) insertMessage(ctx context.Context, conversationID int64, senderType string, senderID *int64, senderName, body string) (Message, error) {
	body = cleanText(body, 4000)
	if body == "" {
		return Message{}, ErrConflict
	}
	now := time.Now().UTC()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Message{}, err
	}
	defer tx.Rollback()
	result, err := tx.ExecContext(ctx, `
		INSERT INTO messages(conversation_id, sender_type, sender_user_id, sender_name, body, created_at)
		VALUES(?, ?, ?, ?, ?, ?)`,
		conversationID, senderType, senderID, cleanText(senderName, 100), body, formatTime(now))
	if err != nil {
		return Message{}, err
	}
	id, _ := result.LastInsertId()
	if _, err := tx.ExecContext(ctx, `UPDATE conversations SET status = 'open', updated_at = ? WHERE id = ?`, formatTime(now), conversationID); err != nil {
		return Message{}, err
	}
	if err := tx.Commit(); err != nil {
		return Message{}, err
	}
	return Message{ID: id, ConversationID: conversationID, SenderType: senderType, SenderUserID: senderID, SenderName: senderName, Body: body, CreatedAt: now}, nil
}

func (s *Store) conversationByID(ctx context.Context, id int64) (Conversation, error) {
	var item Conversation
	var userID, assigned sql.NullInt64
	err := s.db.QueryRowContext(ctx, `
		SELECT id, kind, subject, status, user_id, assigned_to, display_name, updated_at
		FROM conversations WHERE id = ?`, id).
		Scan(&item.ID, &item.Kind, &item.Subject, &item.Status, &userID, &assigned, &item.DisplayName, timeScanner{target: &item.UpdatedAt})
	if errors.Is(err, sql.ErrNoRows) {
		return Conversation{}, ErrNotFound
	}
	if err != nil {
		return Conversation{}, err
	}
	if userID.Valid {
		item.UserID = &userID.Int64
	}
	if assigned.Valid {
		item.AssignedTo = &assigned.Int64
	}
	return item, nil
}

const chatMessagePageSize = 100

// MessagesPage returns the most recent page for a new thread view, or only
// messages after afterID for polling. A cursor prevents old messages from
// permanently hiding newer messages once a conversation grows past 500 rows.
func (s *Store) MessagesPage(ctx context.Context, conversationID, afterID int64) (MessagePage, error) {
	var (
		rows *sql.Rows
		err  error
	)
	if afterID > 0 {
		rows, err = s.db.QueryContext(ctx, `
			SELECT id, conversation_id, sender_type, sender_user_id, sender_name, body, created_at
			FROM messages
			WHERE conversation_id = ? AND id > ?
			ORDER BY id ASC
			LIMIT ?`, conversationID, afterID, chatMessagePageSize)
	} else {
		rows, err = s.db.QueryContext(ctx, `
			SELECT id, conversation_id, sender_type, sender_user_id, sender_name, body, created_at
			FROM (
				SELECT id, conversation_id, sender_type, sender_user_id, sender_name, body, created_at
				FROM messages
				WHERE conversation_id = ?
				ORDER BY id DESC
				LIMIT ?
			)
			ORDER BY id ASC`, conversationID, chatMessagePageSize)
	}
	if err != nil {
		return MessagePage{}, err
	}
	defer rows.Close()

	page := MessagePage{Messages: make([]Message, 0), NextAfterID: afterID}
	for rows.Next() {
		var item Message
		var senderID sql.NullInt64
		if err := rows.Scan(&item.ID, &item.ConversationID, &item.SenderType, &senderID, &item.SenderName, &item.Body, timeScanner{target: &item.CreatedAt}); err != nil {
			return MessagePage{}, err
		}
		if senderID.Valid {
			item.SenderUserID = &senderID.Int64
		}
		page.Messages = append(page.Messages, item)
		page.NextAfterID = item.ID
	}
	if err := rows.Err(); err != nil {
		return MessagePage{}, err
	}
	return page, nil
}

func (s *Store) Messages(ctx context.Context, conversationID int64) ([]Message, error) {
	page, err := s.MessagesPage(ctx, conversationID, 0)
	if err != nil {
		return nil, err
	}
	return page.Messages, nil
}

func (s *Store) ListConversations(ctx context.Context, user SessionUser) ([]Conversation, error) {
	query := `
		SELECT c.id, c.kind, c.subject, c.status, c.user_id, c.assigned_to, c.display_name, c.updated_at,
			COALESCE((
				SELECT COUNT(*)
				FROM messages m
				WHERE m.conversation_id = c.id
				  AND m.id > COALESCE((
					SELECT last_read_message_id
					FROM conversation_reads
					WHERE conversation_id = c.id AND user_id = ?
				  ), 0)
				  AND (
					(? IN ('admin', 'mentor') AND m.sender_type IN ('visitor', 'student'))
					OR (? = 'student' AND m.sender_type IN ('admin', 'mentor'))
				  )
			), 0)
		FROM conversations c`
	args := []any{user.ID, user.Role, user.Role}
	switch user.Role {
	case "admin":
	case "mentor":
		query += ` WHERE c.assigned_to = ?`
		args = append(args, user.ID)
	case "student":
		query += ` WHERE c.user_id = ?`
		args = append(args, user.ID)
	default:
		return nil, ErrForbidden
	}
	query += ` ORDER BY c.updated_at DESC LIMIT 200`
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Conversation, 0)
	for rows.Next() {
		var item Conversation
		var userID, assigned sql.NullInt64
		if err := rows.Scan(&item.ID, &item.Kind, &item.Subject, &item.Status, &userID, &assigned, &item.DisplayName, timeScanner{target: &item.UpdatedAt}, &item.Unread); err != nil {
			return nil, err
		}
		if userID.Valid {
			item.UserID = &userID.Int64
		}
		if assigned.Valid {
			item.AssignedTo = &assigned.Int64
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) markConversationRead(ctx context.Context, userID, conversationID int64) error {
	var latestID int64
	if err := s.db.QueryRowContext(ctx, `SELECT COALESCE(MAX(id), 0) FROM messages WHERE conversation_id = ?`, conversationID).Scan(&latestID); err != nil {
		return err
	}
	if latestID == 0 {
		return nil
	}
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO conversation_reads(conversation_id, user_id, last_read_message_id, updated_at)
		VALUES(?, ?, ?, ?)
		ON CONFLICT(conversation_id, user_id) DO UPDATE SET
			last_read_message_id = MAX(conversation_reads.last_read_message_id, excluded.last_read_message_id),
			updated_at = excluded.updated_at`,
		conversationID, userID, latestID, formatTime(time.Now().UTC()))
	return err
}

func (s *Store) ConversationForUser(ctx context.Context, user SessionUser, id, afterID int64) (Conversation, MessagePage, error) {
	item, err := s.conversationByID(ctx, id)
	if err != nil {
		return Conversation{}, MessagePage{}, err
	}
	if user.Role == "student" && (item.UserID == nil || *item.UserID != user.ID) {
		return Conversation{}, MessagePage{}, ErrForbidden
	}
	if user.Role == "mentor" && (item.AssignedTo == nil || *item.AssignedTo != user.ID) {
		return Conversation{}, MessagePage{}, ErrForbidden
	}
	if user.Role != "admin" && user.Role != "mentor" && user.Role != "student" {
		return Conversation{}, MessagePage{}, ErrForbidden
	}
	page, err := s.MessagesPage(ctx, id, afterID)
	if err != nil {
		return Conversation{}, MessagePage{}, err
	}
	if err := s.markConversationRead(ctx, user.ID, id); err != nil {
		return Conversation{}, MessagePage{}, err
	}
	return item, page, nil
}


func (s *Store) UpdateConversationStatus(ctx context.Context, user SessionUser, conversationID int64, status string) (Conversation, error) {
	if status != "open" && status != "closed" {
		return Conversation{}, ErrConflict
	}
	item, err := s.conversationByID(ctx, conversationID)
	if err != nil {
		return Conversation{}, err
	}
	if user.Role == "mentor" && (item.AssignedTo == nil || *item.AssignedTo != user.ID) {
		return Conversation{}, ErrForbidden
	}
	if user.Role != "admin" && user.Role != "mentor" {
		return Conversation{}, ErrForbidden
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?`,
		status, formatTime(time.Now().UTC()), conversationID); err != nil {
		return Conversation{}, err
	}
	_ = s.audit(ctx, &user.ID, "conversation.status_updated", "conversation", conversationID, map[string]any{"status": status})
	return s.conversationByID(ctx, conversationID)
}
