package downloader

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"

	"github.com/vavallee/bindery/internal/models"
)

func TestProtocolForClient(t *testing.T) {
	if got := ProtocolForClient("sabnzbd"); got != "usenet" {
		t.Fatalf("expected usenet, got %q", got)
	}
	if got := ProtocolForClient("transmission"); got != "torrent" {
		t.Fatalf("expected torrent, got %q", got)
	}
	if got := ProtocolForClient("qbittorrent"); got != "torrent" {
		t.Fatalf("expected torrent, got %q", got)
	}
}

func TestGetLiveStatusesSABnzbd(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if r.URL.Query().Get("mode") != "queue" {
			t.Fatalf("expected mode=queue, got %s", r.URL.Query().Get("mode"))
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"queue": map[string]any{
				"speed": "2.0 MB/s",
				"slots": []map[string]any{{
					"nzo_id":     "nzo123",
					"percentage": "55",
					"timeleft":   "0:10:00",
				}},
			},
		})
	}))
	defer srv.Close()

	host, port := serverHostPort(t, srv.URL)
	client := &models.DownloadClient{Type: "sabnzbd", Host: host, Port: port, APIKey: "k"}

	statusByID, usesTorrentID, err := GetLiveStatuses(context.Background(), client)
	if err != nil {
		t.Fatalf("GetLiveStatuses: %v", err)
	}
	if usesTorrentID {
		t.Fatalf("expected usesTorrentID=false for sabnzbd")
	}
	status, ok := statusByID["nzo123"]
	if !ok {
		t.Fatalf("expected nzo123 status")
	}
	if status.Percentage != "55" || status.TimeLeft != "0:10:00" || status.Speed != "2.0 MB/s" {
		t.Fatalf("unexpected status: %+v", status)
	}
}

func TestGetLiveStatusesTransmission(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/transmission/rpc" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"arguments": map[string]any{
				"torrents": []map[string]any{{
					"id":          7,
					"percentDone": 0.42,
					"eta":         125,
					"rateDownload": 4096,
				}},
			},
			"result": "success",
		})
	}))
	defer srv.Close()

	host, port := serverHostPort(t, srv.URL)
	client := &models.DownloadClient{Type: "transmission", Host: host, Port: port}

	statusByID, usesTorrentID, err := GetLiveStatuses(context.Background(), client)
	if err != nil {
		t.Fatalf("GetLiveStatuses: %v", err)
	}
	if !usesTorrentID {
		t.Fatalf("expected usesTorrentID=true for transmission")
	}
	status, ok := statusByID["7"]
	if !ok {
		t.Fatalf("expected torrent id 7 status")
	}
	if status.Percentage != "42.0" {
		t.Fatalf("unexpected percentage: %s", status.Percentage)
	}
	if status.TimeLeft == "" || status.Speed == "" {
		t.Fatalf("expected non-empty timeLeft/speed, got %+v", status)
	}
}

func TestGetLiveStatusesQbittorrent(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v2/auth/login":
			_, _ = w.Write([]byte("Ok."))
		case "/api/v2/torrents/info":
			_ = json.NewEncoder(w).Encode([]map[string]any{{
				"hash":     "ABCDEF",
				"progress": 0.9,
				"eta":      300,
			}})
		default:
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	host, port := serverHostPort(t, srv.URL)
	client := &models.DownloadClient{Type: "qbittorrent", Host: host, Port: port, Username: "u", Password: "p"}

	statusByID, usesTorrentID, err := GetLiveStatuses(context.Background(), client)
	if err != nil {
		t.Fatalf("GetLiveStatuses: %v", err)
	}
	if !usesTorrentID {
		t.Fatalf("expected usesTorrentID=true for qbittorrent")
	}
	status, ok := statusByID["abcdef"]
	if !ok {
		t.Fatalf("expected normalized hash key")
	}
	if status.Percentage != "90.0" {
		t.Fatalf("unexpected percentage: %s", status.Percentage)
	}
	if status.TimeLeft == "" {
		t.Fatalf("expected non-empty timeLeft")
	}
}

func TestFormattingHelpers(t *testing.T) {
	if got := etaToTimeLeft(0); got != "" {
		t.Fatalf("expected empty eta, got %q", got)
	}
	if got := etaToTimeLeft(3661); got != "1h 01m" {
		t.Fatalf("unexpected eta format: %q", got)
	}
	if got := bytesPerSecondToString(0); got != "" {
		t.Fatalf("expected empty speed, got %q", got)
	}
	if got := bytesPerSecondToString(1024); got != "1.0 KB/s" {
		t.Fatalf("unexpected speed format: %q", got)
	}
}

func serverHostPort(t *testing.T, raw string) (string, int) {
	t.Helper()
	u, err := url.Parse(raw)
	if err != nil {
		t.Fatalf("parse server url: %v", err)
	}
	host := u.Hostname()
	port, err := strconv.Atoi(u.Port())
	if err != nil {
		t.Fatalf("parse server port: %v", err)
	}
	return host, port
}
