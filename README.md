<p align="center">
  <img src="https://raw.githubusercontent.com/vavallee/bindery/main/.github/assets/logo.png" alt="Bindery" width="120" />
</p>

<h1 align="center">Bindery</h1>

<p align="center">
  <strong>Automated book download manager for Usenet & Torrents</strong><br>
  Monitor authors. Search indexers. Download. Organize. Done.
</p>

<p align="center">
  <a href="https://github.com/vavallee/bindery/actions/workflows/ci.yml"><img src="https://github.com/vavallee/bindery/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/vavallee/bindery/releases"><img src="https://img.shields.io/github/v/release/vavallee/bindery" alt="Release" /></a>
  <a href="https://github.com/vavallee/bindery/pkgs/container/bindery"><img src="https://img.shields.io/badge/ghcr.io-vavallee%2Fbindery-blue" alt="Docker" /></a>
  <a href="https://goreportcard.com/report/github.com/vavallee/bindery"><img src="https://goreportcard.com/badge/github.com/vavallee/bindery" alt="Go Report Card" /></a>
  <a href="https://github.com/vavallee/bindery/blob/main/LICENSE"><img src="https://img.shields.io/github/license/vavallee/bindery" alt="License" /></a>
</p>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/vavallee/bindery/main/.github/assets/screenshot.png" alt="Bindery Authors page" width="800" />
</p>

---

## Why Bindery?

**Readarr is dead.** The official project was archived in June 2025 and its metadata backend (`api.bookinfo.club`) is permanently offline. Community forks rely on fragile Goodreads scrapers that break regularly. There was no reliable, open-source tool for automated book management on Usenet.

**Bindery is the clean-room replacement.** Built from scratch in Go with a modern React UI, Bindery uses only stable, documented public APIs for book metadata. No scraping. No dead backends. No fragile dependencies.

## Features

### Library management
- **Author monitoring** — Add authors and Bindery tracks all their works automatically via OpenLibrary's author works endpoint
- **Book tracking** — Per-book monitor toggle, status workflow (wanted → downloading → downloaded → imported)
- **Series support** — Books grouped by series with position tracking and dedicated Series page
- **Edition tracking** — Multiple editions per work, with format, ISBN, publisher, page count
- **Library scan** — Walk `/books/` and reconcile existing files with wanted books in the database

### Search & downloads
- **Newznab + Torznab** — Query multiple Usenet and torrent indexers in parallel, deduplicated and ranked
- **SABnzbd + qBittorrent** — Full support for both Usenet and torrent download clients
- **Auto-grab** — Scheduler searches for wanted books every 12h and automatically grabs the best result
- **Interactive search** — Manual per-book search from the Wanted page with full result details
- **Smart matching** — Four-tier query fallback (`t=book` → `surname+title` → `author+title` → title); word-boundary keyword matching; contiguous-phrase requirement for multi-word titles; dual-author-anchor for ambiguous short titles; subtitle-aware (`Title: Subtitle`)
- **Composite ranking** — Results scored by format quality, edition tags (RETAIL / UNABRIDGED / ABRIDGED), year match to the book's release year, grab count, size, and ISBN exact-match bonus
- **Quality profiles** — Preference order for EPUB / MOBI / AZW3 / PDF, with cutoff rules
- **Language filter** — Preferred language setting (English by default); filters releases with foreign-language tags at word boundaries
- **Custom formats** — Regex-based release scoring for freeleech, retail tags, etc.
- **Delay profiles** — Wait N hours before grabbing to let higher-quality releases appear
- **Blocklist** — Consulted on every search and auto-grab; prevents re-grabbing releases you've rejected. Add entries directly from History with one click
- **Failure visibility** — Download errors surfaced in Queue (active) and History (permanent)

### Import & organize
- **Automatic import** — Completed downloads matched by NZO ID, moved to library with configurable naming template
- **Naming tokens** — `{Author}`, `{SortAuthor}`, `{Title}`, `{Year}`, `{ext}` with sanitized path components
- **Cross-filesystem moves** — Atomic rename when possible, copy+verify+delete for NFS/separate volumes
- **History** — Every grab, import, and failure recorded with full detail (shown inline on History page)

### Metadata
- **OpenLibrary** (primary) — Authors, books, editions, covers, ISBN lookup
- **Google Books** (enricher) — Richer descriptions and ratings
- **Hardcover.app** (enricher) — Community ratings and series data via GraphQL
- No Goodreads scraping. All sources use documented, stable public APIs.

### Operations
- **Webhook notifications** — Configurable HTTP callbacks for grab / import / failure events (pipe to Apprise, ntfy, Home Assistant, etc.)
- **Metadata profiles** — Filter books by language, popularity, page count, ISBN presence
- **Import lists** — Auto-add authors/books from external sources; exclusion list to skip unwanted entries
- **Tag system** — Scope indexers/profiles/notifications to specific authors
- **Backup/restore** — Snapshot the SQLite database on demand
- **API key auth** — Optional `X-Api-Key` header enforcement for external integrations

### UI
- **Modern React SPA** — Clean, dark-mode interface built with React 19 + TypeScript + Tailwind
- **Mobile-friendly** — Responsive layout with hamburger nav, card views for History/Blocklist, agenda view for Calendar
- **Pagination everywhere** — First/Prev/Next/Last + page numbers + configurable page size on all list pages
- **Search, filter, sort** — On Authors, Books, Wanted, and History pages
- **Calendar view** — Upcoming book releases from monitored authors, with compact dot-indicator grid on mobile
- **Full REST API** — Every feature accessible via HTTP for scripting and integration

### Packaging
- **Single binary** — Frontend embedded via `go:embed`. No nginx, no sidecars, no complexity
- **Distroless Docker image** — Minimal attack surface, published to GHCR
- **Kubernetes-ready** — Helm chart included for ArgoCD / Flux deployments
- **SQLite + WAL** — Pure Go driver (`modernc.org/sqlite`), no CGO, no external database to manage

## Quick Start

### Docker (recommended)

```bash
docker run -d \
  --name bindery \
  -p 8787:8787 \
  -v /path/to/config:/config \
  -v /path/to/books:/books \
  -v /path/to/downloads:/downloads \
  ghcr.io/vavallee/bindery:latest
```

### Docker Compose

```yaml
services:
  bindery:
    image: ghcr.io/vavallee/bindery:latest
    container_name: bindery
    ports:
      - 8787:8787
    volumes:
      - ./config:/config
      - /media/books:/books
      - /media/downloads:/downloads
    environment:
      - BINDERY_LOG_LEVEL=info
    restart: unless-stopped
```

### Kubernetes (Helm)

```bash
helm install bindery charts/bindery \
  --set image.tag=latest \
  --set persistence.config.storageClass=longhorn \
  --set ingress.host=bindery.example.com
```

See [`charts/bindery/values.yaml`](charts/bindery/values.yaml) for all configuration options.

### Binary

Download the latest release from [Releases](https://github.com/vavallee/bindery/releases) and run:

```bash
./bindery
```

Open <http://localhost:8787> to access the web UI.

## Configuration

Bindery is configured through the web UI. Key screens under **Settings**:

| Tab | Description |
|-----|-------------|
| **Indexers** | Add your Newznab / Torznab URLs and API keys |
| **Download Clients** | Configure SABnzbd and/or qBittorrent |
| **Notifications** | Webhooks for grab/import/failure events |
| **Quality** | View quality profiles (EPUB / MOBI / AZW3 / PDF ordering) |
| **Metadata** | Optional Google Books API key and metadata profile filters |
| **General** | Preferred language filter, naming template, API key, backup/restore |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BINDERY_PORT` | `8787` | HTTP server port |
| `BINDERY_DB_PATH` | `/config/bindery.db` | SQLite database path |
| `BINDERY_DATA_DIR` | `/config` | Config directory (backups live here) |
| `BINDERY_LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `BINDERY_API_KEY` | _(empty)_ | Enforces `X-Api-Key` header on all `/api/v1/*` routes |
| `BINDERY_DOWNLOAD_DIR` | `/downloads` | Where SABnzbd places completed downloads |
| `BINDERY_LIBRARY_DIR` | `/books` | Destination for imported books |

## Metadata Sources

Bindery aggregates book metadata from multiple open sources:

| Source | Auth Required | Used For |
|--------|---------------|----------|
| [OpenLibrary](https://openlibrary.org) | None | Primary: authors, books, editions, covers, ISBN lookup |
| [Google Books](https://developers.google.com/books) | API key (free) | Enrichment: descriptions, ratings |
| [Hardcover.app](https://hardcover.app) | None (public GraphQL) | Enrichment: community ratings, series |

No Goodreads scraping. All sources use documented, stable public APIs.

## Supported Integrations

### Download clients
- **SABnzbd** — full support (NZB submission, queue/history polling, pause/resume/delete)
- **qBittorrent** — WebUI API v2 with cookie-based auth (add magnet/URL, list/delete torrents)

### Indexers
- **Newznab** (Usenet) — NZBGeek, NZBFinder, NZBPlanet, DrunkenSlug, etc.
- **Torznab** (Torrents) — Prowlarr, Jackett, or direct Torznab endpoints

### Notifications
- **Generic webhooks** — Any HTTP endpoint. Pipe to Apprise, ntfy, Home Assistant, Slack, Discord via proxies.

## Architecture

Bindery is a single Go binary with the React frontend embedded via `go:embed`:

```
   Newznab / Torznab
      indexers
         │
         ▼
┌────────────────────────────┐
│         Bindery            │──► SABnzbd / qBittorrent
│  Go backend + React SPA    │──► /books/ library
│  SQLite (WAL mode)         │──► Webhook notifications
└────────────────────────────┘
    ▲                    ▲
    │                    │
OpenLibrary          Google Books, Hardcover.app
 (primary)                (enrichers)
```

- **Backend:** Go 1.25 with [chi](https://github.com/go-chi/chi) router
- **Database:** SQLite via [modernc.org/sqlite](https://pkg.go.dev/modernc.org/sqlite) (pure Go, no CGO)
- **Frontend:** React 19 + TypeScript + Tailwind CSS + [Vite](https://vite.dev)
- **Container:** Multi-stage build on [distroless](https://github.com/GoogleContainerTools/distroless) (minimal attack surface)

## API

Bindery exposes a full REST API under `/api/v1`. A few highlights:

```
GET    /api/v1/health                    - server health
GET    /api/v1/author                    - list authors
POST   /api/v1/author                    - add author (triggers async book fetch)
GET    /api/v1/book?status=wanted        - filter books by status
POST   /api/v1/book/{id}/search          - manual indexer search for a book
GET    /api/v1/queue                     - active downloads with live SABnzbd overlay
POST   /api/v1/queue/grab                - submit a search result to download client
GET    /api/v1/history                   - grab/import/failure events
POST   /api/v1/history/{id}/blocklist    - add a history event's release to the blocklist
GET    /api/v1/blocklist                 - blocked releases
POST   /api/v1/notification/{id}/test    - fire a test webhook
POST   /api/v1/backup                    - snapshot the database
```

Set `BINDERY_API_KEY` and pass it via `X-Api-Key` header for external access.

## Development

### Prerequisites

- Go 1.25+
- Node.js 22+

### Build

```bash
# Backend only
go build ./cmd/bindery

# Frontend
cd web && npm ci && npm run build

# Go tests
go test ./...

# Frontend typecheck + lint
cd web && npm run typecheck && npm run lint

# Docker image
docker build -t bindery:dev .
```

### Project structure

```
bindery/
├── cmd/bindery/           # Application entry point
├── internal/
│   ├── api/               # HTTP handlers (chi router)
│   ├── db/                # SQLite repository layer + migrations
│   ├── models/            # Domain types
│   ├── metadata/          # OpenLibrary, Google Books, Hardcover
│   ├── indexer/           # Newznab/Torznab client + multi-indexer searcher
│   ├── downloader/        # SABnzbd + qBittorrent clients
│   ├── importer/          # Filename parser, renamer, scanner
│   ├── notifier/          # Webhook dispatcher
│   ├── scheduler/         # Background job runner (cron)
│   ├── webui/             # go:embed for React dist
│   └── config/            # Environment-based configuration
├── web/                   # React frontend (Vite)
├── charts/bindery/        # Helm chart
└── .github/workflows/     # CI/CD
```

## Contributing

Contributions welcome. Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/x`)
3. Ensure `go test ./...` passes and `cd web && npm run build` succeeds
4. Open a Pull Request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## License

MIT. See [LICENSE](LICENSE) for details.

## Acknowledgments

- The [*arr community](https://wiki.servarr.com/) for pioneering the monitor-search-download-import pattern
- [OpenLibrary](https://openlibrary.org) for free, open book metadata
- The Readarr project for the original vision, even though the implementation couldn't be sustained
