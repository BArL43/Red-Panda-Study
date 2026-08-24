package app

import (
	"context"
	"database/sql"
	"errors"
	"strings"
)

func (s *Store) AuthenticatePortal(ctx context.Context, email, password string) (User, error) {
	var (
		user User
		hash string
		salt string
	)
	err := s.db.QueryRowContext(ctx, `
		SELECT u.id, u.role, u.name, u.email, u.status, u.created_at,
			p.password_hash, p.password_salt
		FROM users u
		JOIN portal_credentials p ON p.user_id = u.id
		WHERE u.email = ?`, normalizeEmail(email)).
		Scan(&user.ID, &user.Role, &user.Name, &user.Email, &user.Status, timeScanner{target: &user.CreatedAt}, &hash, &salt)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrForbidden
	}
	if err != nil {
		return User{}, err
	}
	if user.Status != "active" || (user.Role != "student" && user.Role != "mentor") || !verifyPassword(strings.TrimSpace(password), hash, salt) {
		return User{}, ErrForbidden
	}
	return user, nil
}
