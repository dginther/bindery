-- +migrate Up

ALTER TABLE books ADD COLUMN file_path TEXT NOT NULL DEFAULT '';

-- +migrate Down

-- SQLite doesn't support DROP COLUMN before 3.35.0
