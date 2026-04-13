-- +migrate Up

-- MediaType on books: 'ebook' (default) or 'audiobook'.
-- Drives which Newznab category is queried, which library dir a grab lands
-- in, and which formats the ranker prefers.
ALTER TABLE books ADD COLUMN media_type TEXT NOT NULL DEFAULT 'ebook';

-- Audiobook-specific metadata denormalised on books for simpler writes.
-- A proper EditionRepo can promote these to editions later.
ALTER TABLE books ADD COLUMN narrator TEXT NOT NULL DEFAULT '';
ALTER TABLE books ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN asin TEXT NOT NULL DEFAULT '';

CREATE INDEX idx_books_media_type ON books(media_type);
CREATE INDEX idx_books_asin ON books(asin) WHERE asin != '';

-- +migrate Down
DROP INDEX IF EXISTS idx_books_media_type;
-- SQLite can't drop columns without a rebuild; leave them in place on rollback.
