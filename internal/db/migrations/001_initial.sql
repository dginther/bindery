-- +migrate Up

CREATE TABLE authors (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    foreign_id               TEXT    NOT NULL UNIQUE,
    name                     TEXT    NOT NULL,
    sort_name                TEXT    NOT NULL,
    description              TEXT    NOT NULL DEFAULT '',
    image_url                TEXT    NOT NULL DEFAULT '',
    disambiguation           TEXT    NOT NULL DEFAULT '',
    ratings_count            INTEGER NOT NULL DEFAULT 0,
    average_rating           REAL    NOT NULL DEFAULT 0,
    monitored                INTEGER NOT NULL DEFAULT 1,
    quality_profile_id       INTEGER,
    root_folder_id           INTEGER,
    metadata_provider        TEXT    NOT NULL DEFAULT 'openlibrary',
    last_metadata_refresh_at DATETIME,
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_authors_foreign_id ON authors(foreign_id);
CREATE INDEX idx_authors_name ON authors(name);

CREATE TABLE books (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    foreign_id               TEXT    NOT NULL UNIQUE,
    author_id                INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    title                    TEXT    NOT NULL,
    sort_title               TEXT    NOT NULL,
    original_title           TEXT    NOT NULL DEFAULT '',
    description              TEXT    NOT NULL DEFAULT '',
    image_url                TEXT    NOT NULL DEFAULT '',
    release_date             DATE,
    genres                   TEXT    NOT NULL DEFAULT '[]',
    average_rating           REAL    NOT NULL DEFAULT 0,
    ratings_count            INTEGER NOT NULL DEFAULT 0,
    monitored                INTEGER NOT NULL DEFAULT 1,
    status                   TEXT    NOT NULL DEFAULT 'wanted',
    any_edition_ok           INTEGER NOT NULL DEFAULT 1,
    selected_edition_id      INTEGER,
    metadata_provider        TEXT    NOT NULL DEFAULT 'openlibrary',
    last_metadata_refresh_at DATETIME,
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_books_author_id ON books(author_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_foreign_id ON books(foreign_id);

CREATE TABLE series (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    foreign_id  TEXT    NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE series_books (
    series_id          INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    book_id            INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    position_in_series TEXT    NOT NULL DEFAULT '',
    primary_series     INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (series_id, book_id)
);

CREATE TABLE editions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    foreign_id   TEXT    NOT NULL UNIQUE,
    book_id      INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title        TEXT    NOT NULL,
    isbn_13      TEXT,
    isbn_10      TEXT,
    asin         TEXT,
    publisher    TEXT    NOT NULL DEFAULT '',
    publish_date DATE,
    format       TEXT    NOT NULL DEFAULT '',
    num_pages    INTEGER,
    language     TEXT    NOT NULL DEFAULT 'eng',
    image_url    TEXT    NOT NULL DEFAULT '',
    is_ebook     INTEGER NOT NULL DEFAULT 0,
    edition_info TEXT    NOT NULL DEFAULT '',
    monitored    INTEGER NOT NULL DEFAULT 1,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_editions_book_id ON editions(book_id);
CREATE INDEX idx_editions_isbn_13 ON editions(isbn_13);

CREATE TABLE indexers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    type            TEXT    NOT NULL DEFAULT 'newznab',
    url             TEXT    NOT NULL,
    api_key         TEXT    NOT NULL DEFAULT '',
    categories      TEXT    NOT NULL DEFAULT '[7000,7020]',
    priority        INTEGER NOT NULL DEFAULT 25,
    enabled         INTEGER NOT NULL DEFAULT 1,
    supports_search INTEGER NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE download_clients (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    type     TEXT    NOT NULL DEFAULT 'sabnzbd',
    host     TEXT    NOT NULL,
    port     INTEGER NOT NULL DEFAULT 8080,
    api_key  TEXT    NOT NULL DEFAULT '',
    use_ssl  INTEGER NOT NULL DEFAULT 0,
    url_base TEXT    NOT NULL DEFAULT '',
    category TEXT    NOT NULL DEFAULT 'books',
    priority INTEGER NOT NULL DEFAULT 0,
    enabled  INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE downloads (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    guid               TEXT    NOT NULL UNIQUE,
    book_id            INTEGER REFERENCES books(id),
    edition_id         INTEGER REFERENCES editions(id),
    indexer_id         INTEGER REFERENCES indexers(id),
    download_client_id INTEGER REFERENCES download_clients(id),
    title              TEXT    NOT NULL,
    nzb_url            TEXT    NOT NULL,
    size               INTEGER NOT NULL DEFAULT 0,
    sabnzbd_nzo_id     TEXT,
    status             TEXT    NOT NULL DEFAULT 'queued',
    protocol           TEXT    NOT NULL DEFAULT 'usenet',
    quality            TEXT    NOT NULL DEFAULT '',
    indexer_flags      TEXT    NOT NULL DEFAULT '{}',
    error_message      TEXT    NOT NULL DEFAULT '',
    added_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    grabbed_at         DATETIME,
    completed_at       DATETIME,
    imported_at        DATETIME
);
CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_downloads_book_id ON downloads(book_id);
CREATE INDEX idx_downloads_sabnzbd_nzo_id ON downloads(sabnzbd_nzo_id);

CREATE TABLE root_folders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    path       TEXT    NOT NULL UNIQUE,
    free_space INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quality_profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL UNIQUE,
    upgrade_allowed INTEGER NOT NULL DEFAULT 1,
    cutoff          TEXT    NOT NULL DEFAULT 'epub',
    items           TEXT    NOT NULL DEFAULT '[]',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id      INTEGER REFERENCES books(id) ON DELETE SET NULL,
    event_type   TEXT    NOT NULL,
    source_title TEXT    NOT NULL DEFAULT '',
    data         TEXT    NOT NULL DEFAULT '{}',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_history_book_id ON history(book_id);
CREATE INDEX idx_history_created_at ON history(created_at);

-- Seed default quality profiles
INSERT INTO quality_profiles (name, cutoff, items) VALUES ('Any', 'any', '[]');
INSERT INTO quality_profiles (name, cutoff, items) VALUES ('E-Book', 'epub', '[]');
INSERT INTO quality_profiles (name, cutoff, items) VALUES ('Audiobook', 'audiobook', '[]');

-- +migrate Down

DROP TABLE IF EXISTS history;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS quality_profiles;
DROP TABLE IF EXISTS root_folders;
DROP TABLE IF EXISTS downloads;
DROP TABLE IF EXISTS download_clients;
DROP TABLE IF EXISTS indexers;
DROP TABLE IF EXISTS editions;
DROP TABLE IF EXISTS series_books;
DROP TABLE IF EXISTS series;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS authors;
