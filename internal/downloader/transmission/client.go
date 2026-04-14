// Package transmission provides a client for the Transmission BitTorrent daemon RPC API,
// used to submit magnet/torrent URLs and poll status for torrent downloads.
package transmission

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// Client interacts with the Transmission RPC API.
// Authentication is done via HTTP Basic Auth if credentials are provided.
//
// Field mapping for DownloadClient storage:
//   - APIKey  → password  (Transmission uses optional password for RPC auth)
//   - URLBase → username  (used for RPC auth if provided)
type Client struct {
	baseURL   string
	username  string
	password  string
	http      *http.Client
	sessionID string
	mu        sync.Mutex
}

// New creates a Transmission client.
// username and password are optional for Transmission RPC authentication.
func New(host string, port int, username, password string, useSSL bool) *Client {
	scheme := "http"
	if useSSL {
		scheme = "https"
	}

	return &Client{
		baseURL:  fmt.Sprintf("%s://%s:%d/transmission/rpc", scheme, host, port),
		username: username,
		password: password,
		http:     &http.Client{Timeout: 15 * time.Second},
	}
}

// Test verifies connectivity by fetching session information.
func (c *Client) Test(ctx context.Context) error {
	req := c.buildRequest("session-get", map[string]interface{}{})
	_, err := c.doRequest(ctx, req)
	return err
}

// AddTorrent submits a magnet link or torrent URL to Transmission for download.
func (c *Client) AddTorrent(ctx context.Context, magnetOrURL, downloadDir string) (int64, error) {
	args := map[string]interface{}{
		"filename": magnetOrURL,
	}
	if downloadDir != "" {
		args["download-dir"] = downloadDir
	}

	req := c.buildRequest("torrent-add", args)
	respBody, err := c.doRequest(ctx, req)
	if err != nil {
		return 0, err
	}

	var resp TorrentAddResponse
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return 0, fmt.Errorf("decode add torrent response: %w", err)
	}

	if resp.Result != "success" {
		return 0, fmt.Errorf("add torrent failed: %s", resp.Result)
	}

	// Return the ID of the added torrent (prefer newly added, fall back to duplicate)
	if resp.Arguments.TorrentAdded.ID != 0 {
		return resp.Arguments.TorrentAdded.ID, nil
	}
	if resp.Arguments.TorrentDuplicate.ID != 0 {
		return resp.Arguments.TorrentDuplicate.ID, nil
	}

	return 0, fmt.Errorf("no torrent ID returned")
}

// GetTorrents returns torrents in the given download directory (empty = all).
func (c *Client) GetTorrents(ctx context.Context, downloadDir string) ([]Torrent, error) {
	args := map[string]interface{}{
		"fields": []string{"id", "hashString", "name", "totalSize", "downloadedEver",
			"leftUntilDone", "status", "rateDownload", "rateUpload", "eta",
			"percentDone", "downloadDir", "labels"},
	}

	req := c.buildRequest("torrent-get", args)
	respBody, err := c.doRequest(ctx, req)
	if err != nil {
		return nil, err
	}

	var resp TorrentGetResponse
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return nil, fmt.Errorf("decode get torrents response: %w", err)
	}

	if resp.Result != "success" {
		return nil, fmt.Errorf("get torrents failed: %s", resp.Result)
	}

	// Filter by download directory if provided
	if downloadDir != "" {
		filtered := make([]Torrent, 0)
		for _, t := range resp.Arguments.Torrents {
			if t.DownloadDir == downloadDir {
				filtered = append(filtered, t)
			}
		}
		return filtered, nil
	}

	return resp.Arguments.Torrents, nil
}

// RemoveTorrent removes a torrent by ID.
func (c *Client) RemoveTorrent(ctx context.Context, torrentID int64, deleteFiles bool) error {
	args := map[string]interface{}{
		"ids": []int64{torrentID},
	}
	if deleteFiles {
		args["delete-local-data"] = true
	}

	req := c.buildRequest("torrent-remove", args)
	_, err := c.doRequest(ctx, req)
	return err
}

// buildRequest constructs a Transmission RPC request.
func (c *Client) buildRequest(method string, args map[string]interface{}) *http.Request {
	payload := map[string]interface{}{
		"method":    method,
		"arguments": args,
	}

	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, c.baseURL, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	// Add session ID if we have it
	c.mu.Lock()
	if c.sessionID != "" {
		req.Header.Set("X-Transmission-Session-Id", c.sessionID)
	}
	c.mu.Unlock()

	// Add Basic Auth if credentials are provided
	if c.username != "" || c.password != "" {
		authStr := base64.StdEncoding.EncodeToString([]byte(c.username + ":" + c.password))
		req.Header.Set("Authorization", "Basic "+authStr)
	}

	return req
}

// doRequest sends a request and handles the 409 conflict response (session ID update).
func (c *Client) doRequest(ctx context.Context, req *http.Request) ([]byte, error) {
	req = req.WithContext(ctx)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))

	// Handle 409 Conflict - need to set session ID and retry
	if resp.StatusCode == http.StatusConflict {
		sessionID := resp.Header.Get("X-Transmission-Session-Id")
		if sessionID != "" {
			c.mu.Lock()
			c.sessionID = sessionID
			c.mu.Unlock()

			// Retry the request with the new session ID
			req2, err := c.copyRequest(req)
			if err != nil {
				return nil, err
			}
			resp2, err := c.http.Do(req2)
			if err != nil {
				return nil, fmt.Errorf("retry request: %w", err)
			}
			defer resp2.Body.Close()

			body, _ = io.ReadAll(io.LimitReader(resp2.Body, 1024*1024))
			resp = resp2
		}
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("transmission HTTP %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// copyRequest creates a copy of the request with a fresh body.
func (c *Client) copyRequest(orig *http.Request) (*http.Request, error) {
	if orig.GetBody == nil {
		return nil, fmt.Errorf("cannot retry request: missing request body factory")
	}
	body, err := orig.GetBody()
	if err != nil {
		return nil, fmt.Errorf("rebuild retry body: %w", err)
	}

	req := orig.Clone(orig.Context())
	req.Body = body
	req.ContentLength = orig.ContentLength

	// Update session ID header
	c.mu.Lock()
	if c.sessionID != "" {
		req.Header.Set("X-Transmission-Session-Id", c.sessionID)
	}
	c.mu.Unlock()

	return req, nil
}
