# Transmission Torrent Client Integration

## Overview
Bindery now supports Transmission as an alternative torrent download client alongside SABnzbd for Usenet downloads.

## What Was Added

### 1. **Transmission Downloader Package**
   - Location: `internal/downloader/transmission/`
   - Files:
     - `client.go` - Transmission RPC API client with methods for:
       - `New()` - Create a new client instance
       - `Test()` - Verify connectivity
       - `AddTorrent()` - Submit magnet links or torrent files
       - `GetTorrents()` - Poll torrent status
       - `RemoveTorrent()` - Delete torrents
     - `types.go` - RPC API response structures

### 2. **Database Changes**
   - Migration: `internal/db/migrations/007_transmission.sql`
     - Adds `torrent_id` column to downloads table
     - Creates index for efficient lookups
   - New DB methods in `internal/db/downloads.go`:
     - `SetTorrentID()` - Store Transmission torrent ID
     - `GetByTorrentID()` - Query downloads by torrent ID

### 3. **Model Updates**
   - `internal/models/download.go`:
     - Added `TorrentID` field to store Transmission torrent identifiers
     - Added `Username`/`Password` fields to DownloadClient for credential-based auth

### 4. **API Integration**
   - `internal/api/download_clients.go`:
     - Test handler now supports both SABnzbd and Transmission
     - Auto-detects client type and uses appropriate credentials
   - `internal/api/queue.go`:
     - Grab handler supports both client types
     - Delete handler removes torrents from Transmission or NZBs from SABnzbd

### 5. **Scheduler Updates**
   - `internal/scheduler/scheduler.go`:
     - searchWanted() method dispatches to correct downloader
     - Stores torrent ID or NZO ID based on client type

### 6. **Importer Scanner Updates**
   - `internal/importer/scanner.go`:
     - New `checkTransmissionDownloads()` method polls Transmission torrent status
     - New `checkSABnzbdDownloads()` method extracted from original logic
     - Monitors torrent completion based on status codes:
       - Status 3 (seeding) = complete
       - Status 0,6 (stopped) = failed
     - Unified import logic works with both client types

## Configuration

### Setting Up Transmission

1. **Create Download Client via API or UI:**
   ```json
   {
     "name": "Transmission",
     "type": "transmission",
     "host": "192.168.1.100",
     "port": 9091,
     "username": "transmission_user",
     "password": "transmission_password",
     "useSsl": false,
     "category": "books",
     "enabled": true
   }
   ```

2. **Field Mapping:**
   - `username` → Transmission RPC username
   - `password` → Transmission RPC password
   - `host` → Transmission server IP/hostname
   - `port` → RPC port (default: 9091)
   - `useSsl` → Whether to use HTTPS
   - `category` → Used as download directory label

### Authentication
- Transmission uses HTTP Basic Auth via the RPC API
- The client automatically handles session ID negotiation (409 Conflict responses)
- Supports optional password authentication if configured in Transmission

## Torrent Status Monitoring

The scanner monitors the following Transmission status codes:

| Status | Meaning |
|--------|---------|
| 0 | Stopped |
| 1 | Checking |
| 2 | Downloading |
| 3 | Seeding |
| 4 | Allocating |
| 5 | Checking (resume) |
| 6 | Stopped (paused) |

Downloads are considered **complete** when:
- Torrent status = 3 (seeding), OR
- PercentDone >= 1.0

Downloads are marked as **failed** when:
- Torrent is stopped (status 0 or 6) AND
- Download is not yet complete

## Features

✅ **Torrent Downloads**
- Submit magnet links and torrent URLs
- Automatic torrent import into library
- Configurable download directory per client

✅ **Status Monitoring**
- Real-time download progress tracking
- Automatic import on completion
- Failed download detection

✅ **Mixed Configurations**
- Can run SABnzbd and Transmission simultaneously
- Downloader selection is automatic based on enabled clients
- Both Usenet (NZB) and Torrent (magnet/torrent) support

✅ **Cleanup**
- Automatic torrent removal from Transmission after import
- Optional SABnzbd history cleanup

## API Examples

### Test Connection
```bash
curl -X GET http://localhost:5000/api/download-clients/1/test
```

### Create Transmission Client
```bash
curl -X POST http://localhost:5000/api/download-clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Transmission",
    "type": "transmission",
    "host": "192.168.1.100",
    "port": 9091,
    "username": "user",
    "password": "pass",
    "useSsl": false,
    "category": "books",
    "enabled": true
  }'
```

### Submit Download (automatic dispatch)
```bash
curl -X POST http://localhost:5000/api/queue/grab \
  -H "Content-Type: application/json" \
  -d '{
    "guid": "abc123",
    "title": "Book Title Author",
    "nzbUrl": "magnet:?xt=urn:btih:...",
    "size": 12345678
  }'
```

## Database Migration

The new `007_transmission.sql` migration adds support for torrent ID tracking. It will be automatically applied on the next database initialization.

## Notes

- The Transmission integration follows the same patterns as the existing SABnzbd integration
- File import logic is shared between both downloader types
- Protocol field is automatically set to "torrent" for Transmission downloads
- Remote ID (NZO ID or Torrent ID) is stored in the appropriate field based on client type
