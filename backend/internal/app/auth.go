package app

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
)

const passwordIterations = 180_000

func randomToken(bytes int) (string, error) {
	buffer := make([]byte, bytes)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func tokenHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func constantStringEqual(left, right string) bool {
	return subtle.ConstantTimeCompare([]byte(left), []byte(right)) == 1
}

func hashPassword(password string) (hash string, salt string, err error) {
	if len(password) < 12 {
		return "", "", errors.New("password must contain at least 12 characters")
	}
	saltBytes := make([]byte, 24)
	if _, err = rand.Read(saltBytes); err != nil {
		return "", "", err
	}
	derived := pbkdf2SHA256([]byte(password), saltBytes, passwordIterations, 32)
	return base64.RawStdEncoding.EncodeToString(derived), base64.RawStdEncoding.EncodeToString(saltBytes), nil
}

func verifyPassword(password, encodedHash, encodedSalt string) bool {
	hashBytes, err := base64.RawStdEncoding.DecodeString(encodedHash)
	if err != nil {
		return false
	}
	saltBytes, err := base64.RawStdEncoding.DecodeString(encodedSalt)
	if err != nil {
		return false
	}
	derived := pbkdf2SHA256([]byte(password), saltBytes, passwordIterations, len(hashBytes))
	return subtle.ConstantTimeCompare(derived, hashBytes) == 1
}

func pbkdf2SHA256(password, salt []byte, iterations, keyLength int) []byte {
	hashLength := sha256.Size
	blocks := (keyLength + hashLength - 1) / hashLength
	result := make([]byte, 0, blocks*hashLength)

	for block := 1; block <= blocks; block++ {
		mac := hmac.New(sha256.New, password)
		mac.Write(salt)
		mac.Write([]byte{byte(block >> 24), byte(block >> 16), byte(block >> 8), byte(block)})
		u := mac.Sum(nil)
		t := append([]byte(nil), u...)

		for iteration := 1; iteration < iterations; iteration++ {
			mac = hmac.New(sha256.New, password)
			mac.Write(u)
			u = mac.Sum(nil)
			for index := range t {
				t[index] ^= u[index]
			}
		}
		result = append(result, t...)
	}
	return result[:keyLength]
}

func normalizeEmail(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func validRole(role string) bool {
	return role == "admin" || role == "student" || role == "mentor"
}
