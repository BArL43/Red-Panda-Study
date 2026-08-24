package app

import (
	"encoding/json"
	"time"
)

type Config struct {
	Addr             string
	DatabasePath     string
	SessionCookie    string
	SessionTTL       time.Duration
	InviteTTL        time.Duration
	AdminEmail       string
	AdminPassword    string
	PublicAppURL     string
	AllowedOrigins   []string
	SecureCookies    bool
	CrossSiteCookies bool
	DevelopmentMode  bool
}

type User struct {
	ID        int64     `json:"id"`
	Role      string    `json:"role"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type SessionUser struct {
	ID    int64  `json:"id"`
	Role  string `json:"role"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Consultation struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Contact   string    `json:"contact"`
	Country   string    `json:"country"`
	Level     string    `json:"level"`
	Intake    string    `json:"intake"`
	Notes     string    `json:"notes"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Invitation struct {
	ID        int64      `json:"id"`
	Role      string     `json:"role"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	Link      string     `json:"link,omitempty"`
}

type Conversation struct {
	ID          int64     `json:"id"`
	Kind        string    `json:"kind"`
	Subject     string    `json:"subject"`
	Status      string    `json:"status"`
	UserID      *int64    `json:"user_id,omitempty"`
	AssignedTo  *int64    `json:"assigned_to,omitempty"`
	DisplayName string    `json:"display_name"`
	UpdatedAt   time.Time `json:"updated_at"`
	Unread      int       `json:"unread"`
}

type Message struct {
	ID             int64     `json:"id"`
	ConversationID int64     `json:"conversation_id"`
	SenderType     string    `json:"sender_type"`
	SenderUserID   *int64    `json:"sender_user_id,omitempty"`
	SenderName     string    `json:"sender_name"`
	Body           string    `json:"body"`
	CreatedAt      time.Time `json:"created_at"`
}

type MessagePage struct {
	Messages    []Message `json:"messages"`
	NextAfterID int64     `json:"next_after_id"`
}

type Task struct {
	ID          int64      `json:"id"`
	StudentID   int64      `json:"student_id"`
	AssignedBy  int64      `json:"assigned_by"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type StudentProfile struct {
	UserID   int64  `json:"user_id"`
	Country  string `json:"country"`
	Level    string `json:"level"`
	Intake   string `json:"intake"`
	Progress int    `json:"progress"`
}

type StudentSummary struct {
	User         User           `json:"user"`
	Profile      StudentProfile `json:"profile"`
	Mentor       *User          `json:"mentor,omitempty"`
	Tasks        []Task         `json:"tasks"`
	Conversation *Conversation  `json:"conversation,omitempty"`
}

type MentorStudent struct {
	User      User           `json:"user"`
	Profile   StudentProfile `json:"profile"`
	OpenTasks int            `json:"open_tasks"`
}


type CompassSnapshot struct {
	ID          int64           `json:"id"`
	StudentID   int64           `json:"student_id"`
	Profile     json.RawMessage `json:"profile"`
	Analysis    json.RawMessage `json:"analysis"`
	Mode        string          `json:"mode"`
	Model       *string         `json:"model,omitempty"`
	GeneratedAt time.Time       `json:"generated_at"`
	CreatedAt   time.Time       `json:"created_at"`
}
