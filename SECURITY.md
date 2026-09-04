# Security

Red Panda Study is an educational project that handles account, chat and admissions-planning data. Please do not publish real credentials or user data in issues, pull requests or commits.

## Secrets

Keep these values outside Git:

- `VIBE_API_KEY`
- administrator credentials
- production `.env` files
- TLS/private keys
- SQLite databases and backups containing user data

Only placeholder values belong in committed `.env.example` files.

## Reporting

If you find a security issue, contact the repository owner privately rather than opening a public issue with exploit details or sensitive data.

## Scope

The project is designed for an early-stage, small-scale deployment. Security-sensitive changes should preserve server-side authorization, origin checks, session-cookie protections and input validation, and should be covered by tests where practical.
