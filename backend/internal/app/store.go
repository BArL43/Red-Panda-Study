package app

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var (
	ErrNotFound      = errors.New("not found")
	ErrForbidden     = errors.New("forbidden")
	ErrInviteUsed    = errors.New("invitation already used")
	ErrInviteExpired = errors.New("invitation expired")
	ErrConflict      = errors.New("conflict")
)

type Store struct {
	db *sql.DB
}

func OpenStore(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		return nil, fmt.Errorf("create database directory: %w", err)
	}
	dsn := fmt.Sprintf("file:%s?_busy_timeout=5000&_foreign_keys=on&_journal_mode=WAL&_synchronous=NORMAL", path)
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	store := &Store{db: db}
	if err := store.migrate(context.Background()); err != nil {
		db.Close()
		return nil, err
	}
	return store, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) Ready(ctx context.Context) error { return s.db.PingContext(ctx) }

func (s *Store) migrate(ctx context.Context) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			role TEXT NOT NULL CHECK(role IN ('admin','student','mentor')),
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE COLLATE NOCASE,
			status TEXT NOT NULL DEFAULT 'active',
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS admin_credentials (
			user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			password_hash TEXT NOT NULL,
			password_salt TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS portal_credentials (
			user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			password_hash TEXT NOT NULL,
			password_salt TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS invitations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			token_hash TEXT NOT NULL UNIQUE,
			role TEXT NOT NULL CHECK(role IN ('student','mentor')),
			name TEXT NOT NULL,
			email TEXT NOT NULL COLLATE NOCASE,
			expires_at TEXT NOT NULL,
			used_at TEXT,
			created_by INTEGER NOT NULL REFERENCES users(id),
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			token_hash TEXT NOT NULL UNIQUE,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS consultations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			contact TEXT NOT NULL,
			country TEXT NOT NULL,
			level TEXT NOT NULL,
			intake TEXT NOT NULL,
			notes TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'new',
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS annual_subscriptions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			customer_email TEXT NOT NULL UNIQUE COLLATE NOCASE,
			student_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			plan TEXT NOT NULL CHECK(plan IN ('start','admission','select')),
			status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled','refunded')),
			purchase_reference TEXT UNIQUE,
			purchased_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS student_profiles (
			user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			country TEXT NOT NULL DEFAULT 'Не выбрано',
			level TEXT NOT NULL DEFAULT 'Не выбрано',
			intake TEXT NOT NULL DEFAULT 'Не выбрано',
			progress INTEGER NOT NULL DEFAULT 12
		)`,
		`CREATE TABLE IF NOT EXISTS mentor_assignments (
			mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TEXT NOT NULL,
			PRIMARY KEY (mentor_id, student_id)
		)`,
		`CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			assigned_by INTEGER NOT NULL REFERENCES users(id),
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'todo',
			due_at TEXT,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS conversations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			kind TEXT NOT NULL CHECK(kind IN ('public','student')),
			visitor_token_hash TEXT,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			subject TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'open',
			assigned_to INTEGER REFERENCES users(id),
			display_name TEXT NOT NULL DEFAULT 'Гость',
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			sender_type TEXT NOT NULL CHECK(sender_type IN ('visitor','student','mentor','admin','system')),
			sender_user_id INTEGER REFERENCES users(id),
			sender_name TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS compass_profiles (
			student_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			profile_json TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS compass_analyses (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			mode TEXT NOT NULL CHECK(mode IN ('ai','rules')),
			model TEXT,
			analysis_json TEXT NOT NULL,
			generated_at TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS audit_log (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			actor_user_id INTEGER REFERENCES users(id),
			action TEXT NOT NULL,
			entity_type TEXT NOT NULL,
			entity_id INTEGER,
			metadata TEXT NOT NULL DEFAULT '{}',
			created_at TEXT NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(token_hash)`,
		`CREATE INDEX IF NOT EXISTS idx_invitations_hash ON invitations(token_hash)`,
		`CREATE INDEX IF NOT EXISTS idx_consultations_created ON consultations(created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_annual_subscriptions_status ON annual_subscriptions(status)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, id)`,
		`CREATE INDEX IF NOT EXISTS idx_tasks_student ON tasks(student_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_compass_analyses_student ON compass_analyses(student_id, generated_at DESC, id DESC)`,
		// Repair any legacy duplicate assignments before enforcing the business
		// rule at database level: one active mentor per student.
		`DELETE FROM mentor_assignments
		 WHERE rowid NOT IN (SELECT MAX(rowid) FROM mentor_assignments GROUP BY student_id)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_assignments_student ON mentor_assignments(student_id)`,
	}
	for _, statement := range statements {
		if _, err := s.db.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}
	return nil
}

func (s *Store) CohortAvailability(ctx context.Context) (int, error) {
	var taken int
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM annual_subscriptions WHERE status = 'active'`).Scan(&taken)
	return taken, err
}

func (s *Store) RecordAnnualSubscription(ctx context.Context, email, plan, reference string) error {
	email = normalizeEmail(email)
	plan = strings.ToLower(strings.TrimSpace(plan))
	if email == "" || (plan != "start" && plan != "admission" && plan != "select") {
		return ErrConflict
	}
	var studentID sql.NullInt64
	_ = s.db.QueryRowContext(ctx, `SELECT id FROM users WHERE email = ? AND role = 'student'`, email).Scan(&studentID)
	now := formatTime(time.Now().UTC())
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO annual_subscriptions(customer_email, student_id, plan, status, purchase_reference, purchased_at, updated_at)
		VALUES(?, ?, ?, 'active', NULLIF(?, ''), ?, ?)
		ON CONFLICT(customer_email) DO UPDATE SET
			student_id = excluded.student_id,
			plan = excluded.plan,
			status = 'active',
			purchase_reference = COALESCE(excluded.purchase_reference, annual_subscriptions.purchase_reference),
			updated_at = excluded.updated_at`,
		email, studentID, plan, strings.TrimSpace(reference), now, now)
	return err
}

func (s *Store) SeedAdmin(ctx context.Context, email, password string) (User, error) {
	var user User
	row := s.db.QueryRowContext(ctx, `SELECT id, role, name, email, status, created_at FROM users WHERE email = ?`, normalizeEmail(email))
	if err := scanUser(row, &user); err == nil {
		// ADMIN_PASSWORD is the production source of truth. Synchronize the
		// stored credential on every startup so rotating the Render secret
		// always takes effect. UPSERT also repairs an incomplete legacy row.
		if user.Role != "admin" {
			return User{}, fmt.Errorf("configured ADMIN_EMAIL belongs to a non-admin user")
		}
		hash, salt, hashErr := hashPassword(password)
		if hashErr != nil {
			return User{}, hashErr
		}
		now := formatTime(time.Now().UTC())
		tx, txErr := s.db.BeginTx(ctx, nil)
		if txErr != nil {
			return User{}, txErr
		}
		defer tx.Rollback()
		if _, txErr = tx.ExecContext(ctx, `UPDATE users SET status = 'active' WHERE id = ?`, user.ID); txErr != nil {
			return User{}, txErr
		}
		if _, txErr = tx.ExecContext(ctx, `
			INSERT INTO admin_credentials(user_id, password_hash, password_salt, updated_at)
			VALUES(?, ?, ?, ?)
			ON CONFLICT(user_id) DO UPDATE SET
				password_hash = excluded.password_hash,
				password_salt = excluded.password_salt,
				updated_at = excluded.updated_at`,
			user.ID, hash, salt, now,
		); txErr != nil {
			return User{}, txErr
		}
		if txErr = tx.Commit(); txErr != nil {
			return User{}, txErr
		}
		user.Status = "active"
		return user, nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return User{}, err
	}

	hash, salt, err := hashPassword(password)
	if err != nil {
		return User{}, err
	}
	now := time.Now().UTC()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return User{}, err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx, `INSERT INTO users(role, name, email, status, created_at) VALUES('admin', 'Администратор', ?, 'active', ?)`, normalizeEmail(email), formatTime(now))
	if err != nil {
		return User{}, err
	}
	id, _ := result.LastInsertId()
	if _, err := tx.ExecContext(ctx, `INSERT INTO admin_credentials(user_id, password_hash, password_salt, updated_at) VALUES(?, ?, ?, ?)`, id, hash, salt, formatTime(now)); err != nil {
		return User{}, err
	}
	if err := tx.Commit(); err != nil {
		return User{}, err
	}
	return User{ID: id, Role: "admin", Name: "Администратор", Email: normalizeEmail(email), Status: "active", CreatedAt: now}, nil
}

func (s *Store) AuthenticateAdmin(ctx context.Context, email, password string) (User, error) {
	var user User
	var hash, salt string
	err := s.db.QueryRowContext(ctx, `
		SELECT u.id, u.role, u.name, u.email, u.status, u.created_at, c.password_hash, c.password_salt
		FROM users u JOIN admin_credentials c ON c.user_id = u.id
		WHERE u.email = ? AND u.role = 'admin' AND u.status = 'active'`,
		normalizeEmail(email),
	).Scan(&user.ID, &user.Role, &user.Name, &user.Email, &user.Status, timeScanner{target: &user.CreatedAt}, &hash, &salt)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && !verifyPassword(password, hash, salt)) {
		return User{}, ErrForbidden
	}
	return user, err
}

func (s *Store) CreateSession(ctx context.Context, userID int64, ttl time.Duration) (string, error) {
	raw, err := randomToken(32)
	if err != nil {
		return "", err
	}
	now := time.Now().UTC()
	_, err = s.db.ExecContext(ctx, `INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES(?, ?, ?, ?)`,
		tokenHash(raw), userID, formatTime(now.Add(ttl)), formatTime(now))
	return raw, err
}

func (s *Store) SessionUser(ctx context.Context, raw string) (SessionUser, error) {
	var user SessionUser
	var expires string
	err := s.db.QueryRowContext(ctx, `
		SELECT u.id, u.role, u.name, u.email, s.expires_at
		FROM sessions s JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = ? AND u.status = 'active'`, tokenHash(raw),
	).Scan(&user.ID, &user.Role, &user.Name, &user.Email, &expires)
	if errors.Is(err, sql.ErrNoRows) {
		return SessionUser{}, ErrForbidden
	}
	if err != nil {
		return SessionUser{}, err
	}
	expiry, _ := parseTime(expires)
	if time.Now().UTC().After(expiry) {
		s.DeleteSession(ctx, raw)
		return SessionUser{}, ErrForbidden
	}
	return user, nil
}

func (s *Store) DeleteSession(ctx context.Context, raw string) {
	_, _ = s.db.ExecContext(ctx, `DELETE FROM sessions WHERE token_hash = ?`, tokenHash(raw))
}

func (s *Store) CleanupExpired(ctx context.Context) {
	now := formatTime(time.Now().UTC())
	_, _ = s.db.ExecContext(ctx, `DELETE FROM sessions WHERE expires_at < ?`, now)
}

func (s *Store) CreateConsultation(ctx context.Context, item Consultation) (Consultation, error) {
	now := time.Now().UTC()
	result, err := s.db.ExecContext(ctx, `
		INSERT INTO consultations(name, contact, country, level, intake, notes, status, created_at)
		VALUES(?, ?, ?, ?, ?, ?, 'new', ?)`,
		item.Name, item.Contact, item.Country, item.Level, item.Intake, item.Notes, formatTime(now))
	if err != nil {
		return Consultation{}, err
	}
	item.ID, _ = result.LastInsertId()
	item.Status = "new"
	item.CreatedAt = now
	_ = s.audit(ctx, nil, "consultation.created", "consultation", item.ID, map[string]any{"country": item.Country})
	return item, nil
}

func (s *Store) ListConsultations(ctx context.Context) ([]Consultation, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, contact, country, level, intake, notes, status, created_at FROM consultations ORDER BY id DESC LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Consultation, 0)
	for rows.Next() {
		var item Consultation
		if err := rows.Scan(&item.ID, &item.Name, &item.Contact, &item.Country, &item.Level, &item.Intake, &item.Notes, &item.Status, timeScanner{target: &item.CreatedAt}); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) UpdateConsultationStatus(ctx context.Context, actorID, id int64, status string) error {
	if status != "new" && status != "contacted" && status != "qualified" && status != "closed" {
		return ErrConflict
	}
	result, err := s.db.ExecContext(ctx, `UPDATE consultations SET status = ? WHERE id = ?`, status, id)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return ErrNotFound
	}
	_ = s.audit(ctx, &actorID, "consultation.status_changed", "consultation", id, map[string]any{"status": status})
	return nil
}

func formatTime(value time.Time) string { return value.UTC().Format(time.RFC3339Nano) }

func parseTime(value string) (time.Time, error) { return time.Parse(time.RFC3339Nano, value) }

type timeScanner struct{ target *time.Time }

func (s timeScanner) Scan(src any) error {
	value, ok := src.(string)
	if !ok {
		if bytes, byteOK := src.([]byte); byteOK {
			value = string(bytes)
		} else {
			return fmt.Errorf("unsupported time value %T", src)
		}
	}
	parsed, err := parseTime(value)
	if err == nil {
		*s.target = parsed
	}
	return err
}

type rowScanner interface{ Scan(dest ...any) error }

func scanUser(row rowScanner, user *User) error {
	return row.Scan(&user.ID, &user.Role, &user.Name, &user.Email, &user.Status, timeScanner{target: &user.CreatedAt})
}

func (s *Store) audit(ctx context.Context, actorID *int64, action, entityType string, entityID int64, metadata any) error {
	encoded, _ := json.Marshal(metadata)
	_, err := s.db.ExecContext(ctx, `INSERT INTO audit_log(actor_user_id, action, entity_type, entity_id, metadata, created_at) VALUES(?, ?, ?, ?, ?, ?)`,
		actorID, action, entityType, entityID, string(encoded), formatTime(time.Now().UTC()))
	return err
}

func cleanText(value string, max int) string {
	value = strings.TrimSpace(value)
	if len([]rune(value)) <= max {
		return value
	}
	return string([]rune(value)[:max])
}
