package app

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

const maxCompassDocumentBytes = 256 << 10

func (s *Store) SaveCompassAnalysis(ctx context.Context, studentID int64, profile, analysis json.RawMessage) (CompassSnapshot, error) {
	if studentID <= 0 || len(profile) == 0 || len(profile) > maxCompassDocumentBytes || len(analysis) == 0 || len(analysis) > maxCompassDocumentBytes || !json.Valid(profile) || !json.Valid(analysis) {
		return CompassSnapshot{}, ErrConflict
	}

	var role, status string
	if err := s.db.QueryRowContext(ctx, `SELECT role, status FROM users WHERE id = ?`, studentID).Scan(&role, &status); errors.Is(err, sql.ErrNoRows) {
		return CompassSnapshot{}, ErrNotFound
	} else if err != nil {
		return CompassSnapshot{}, err
	}
	if role != "student" || status != "active" {
		return CompassSnapshot{}, ErrForbidden
	}

	var metadata struct {
		Mode        string  `json:"mode"`
		Model       *string `json:"model"`
		GeneratedAt string  `json:"generatedAt"`
	}
	if err := json.Unmarshal(analysis, &metadata); err != nil || (metadata.Mode != "ai" && metadata.Mode != "rules") {
		return CompassSnapshot{}, ErrConflict
	}
	generatedAt, err := time.Parse(time.RFC3339, metadata.GeneratedAt)
	if err != nil {
		return CompassSnapshot{}, ErrConflict
	}
	now := time.Now().UTC()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return CompassSnapshot{}, err
	}
	defer tx.Rollback()

	if _, err = tx.ExecContext(ctx, `
		INSERT INTO compass_profiles(student_id, profile_json, updated_at)
		VALUES(?, ?, ?)
		ON CONFLICT(student_id) DO UPDATE SET
			profile_json = excluded.profile_json,
			updated_at = excluded.updated_at`,
		studentID, string(profile), formatTime(now)); err != nil {
		return CompassSnapshot{}, err
	}
	result, err := tx.ExecContext(ctx, `
		INSERT INTO compass_analyses(student_id, mode, model, analysis_json, generated_at, created_at)
		VALUES(?, ?, ?, ?, ?, ?)`,
		studentID, metadata.Mode, metadata.Model, string(analysis), formatTime(generatedAt.UTC()), formatTime(now))
	if err != nil {
		return CompassSnapshot{}, err
	}
	id, _ := result.LastInsertId()
	if err = tx.Commit(); err != nil {
		return CompassSnapshot{}, err
	}
	_ = s.audit(ctx, &studentID, "compass.analysis_saved", "compass_analysis", id, map[string]any{"mode": metadata.Mode})
	return CompassSnapshot{
		ID: id, StudentID: studentID, Profile: append(json.RawMessage(nil), profile...), Analysis: append(json.RawMessage(nil), analysis...),
		Mode: metadata.Mode, Model: metadata.Model, GeneratedAt: generatedAt.UTC(), CreatedAt: now,
	}, nil
}

func (s *Store) LatestCompassAnalysis(ctx context.Context, studentID int64) (CompassSnapshot, error) {
	var result CompassSnapshot
	var profileJSON, analysisJSON, model sql.NullString
	var generatedAt, createdAt string
	err := s.db.QueryRowContext(ctx, `
		SELECT a.id, a.student_id, p.profile_json, a.mode, a.model, a.analysis_json, a.generated_at, a.created_at
		FROM compass_analyses a
		JOIN compass_profiles p ON p.student_id = a.student_id
		WHERE a.student_id = ?
		ORDER BY a.generated_at DESC, a.id DESC
		LIMIT 1`, studentID).Scan(
		&result.ID, &result.StudentID, &profileJSON, &result.Mode, &model, &analysisJSON, &generatedAt, &createdAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return CompassSnapshot{}, ErrNotFound
	}
	if err != nil {
		return CompassSnapshot{}, err
	}
	if !json.Valid([]byte(profileJSON.String)) || !json.Valid([]byte(analysisJSON.String)) {
		return CompassSnapshot{}, fmt.Errorf("stored Compass data is invalid")
	}
	result.Profile = json.RawMessage(profileJSON.String)
	result.Analysis = json.RawMessage(analysisJSON.String)
	if model.Valid && model.String != "" {
		value := model.String
		result.Model = &value
	}
	if result.GeneratedAt, err = parseTime(generatedAt); err != nil {
		return CompassSnapshot{}, err
	}
	if result.CreatedAt, err = parseTime(createdAt); err != nil {
		return CompassSnapshot{}, err
	}
	return result, nil
}

func (s *Store) CompassForStudent(ctx context.Context, actor SessionUser, studentID int64) (CompassSnapshot, error) {
	if studentID <= 0 {
		return CompassSnapshot{}, ErrNotFound
	}
	if actor.Role == "student" && actor.ID != studentID {
		return CompassSnapshot{}, ErrForbidden
	}
	if actor.Role == "mentor" {
		var assigned int
		if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM mentor_assignments WHERE mentor_id = ? AND student_id = ?`, actor.ID, studentID).Scan(&assigned); err != nil {
			return CompassSnapshot{}, err
		}
		if assigned == 0 {
			return CompassSnapshot{}, ErrForbidden
		}
	}
	if actor.Role != "admin" && actor.Role != "mentor" && actor.Role != "student" {
		return CompassSnapshot{}, ErrForbidden
	}
	return s.LatestCompassAnalysis(ctx, studentID)
}
