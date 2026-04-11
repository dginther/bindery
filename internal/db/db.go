package db

import (
	"database/sql"
	"embed"
	"fmt"
	"log/slog"
	"strings"

	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Open creates a new database connection and runs migrations.
func Open(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := setPragmas(db); err != nil {
		db.Close()
		return nil, err
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	if err := migrate(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	slog.Info("database ready", "path", dbPath)
	return db, nil
}

// OpenMemory creates an in-memory database for testing.
func OpenMemory() (*sql.DB, error) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		return nil, fmt.Errorf("open memory database: %w", err)
	}

	if err := setPragmas(db); err != nil {
		db.Close()
		return nil, err
	}

	if err := migrate(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return db, nil
}

func setPragmas(db *sql.DB) error {
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA foreign_keys=ON",
		"PRAGMA busy_timeout=5000",
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			return fmt.Errorf("set %s: %w", p, err)
		}
	}
	return nil
}

func migrate(database *sql.DB) error {
	content, err := migrationsFS.ReadFile("migrations/001_initial.sql")
	if err != nil {
		return fmt.Errorf("read migration: %w", err)
	}

	// Extract only the Up portion (before -- +migrate Down)
	sqlStr := string(content)
	if idx := strings.Index(sqlStr, "-- +migrate Down"); idx >= 0 {
		sqlStr = sqlStr[:idx]
	}

	// Remove the +migrate Up marker
	sqlStr = strings.Replace(sqlStr, "-- +migrate Up", "", 1)

	// Create a migrations tracking table
	_, err = database.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return fmt.Errorf("create migrations table: %w", err)
	}

	// Check if already applied
	var count int
	err = database.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version = 1").Scan(&count)
	if err != nil {
		return fmt.Errorf("check migration status: %w", err)
	}

	if count > 0 {
		return nil
	}

	// Split into individual statements and execute each
	statements := strings.Split(sqlStr, ";")
	for _, stmt := range statements {
		// Strip comment-only lines but keep SQL that follows comments
		lines := strings.Split(stmt, "\n")
		var cleaned []string
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if trimmed == "" || strings.HasPrefix(trimmed, "--") {
				continue
			}
			cleaned = append(cleaned, line)
		}
		stmt = strings.TrimSpace(strings.Join(cleaned, "\n"))
		if stmt == "" {
			continue
		}
		if _, err := database.Exec(stmt); err != nil {
			return fmt.Errorf("apply migration statement: %w\nSQL: %s", err, stmt)
		}
	}

	_, err = database.Exec("INSERT INTO schema_migrations (version) VALUES (1)")
	if err != nil {
		return fmt.Errorf("record migration: %w", err)
	}

	slog.Info("applied migration", "version", 1)
	return nil
}
