package models

import "time"

type Setting struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type RootFolder struct {
	ID        int64     `json:"id"`
	Path      string    `json:"path"`
	FreeSpace int64     `json:"freeSpace"`
	CreatedAt time.Time `json:"createdAt"`
}

type QualityProfile struct {
	ID             int64           `json:"id"`
	Name           string          `json:"name"`
	UpgradeAllowed bool            `json:"upgradeAllowed"`
	Cutoff         string          `json:"cutoff"`
	Items          []QualityItem   `json:"items"`
	CreatedAt      time.Time       `json:"createdAt"`
}

type QualityItem struct {
	Quality string `json:"quality"`
	Allowed bool   `json:"allowed"`
}

type HistoryEvent struct {
	ID          int64     `json:"id"`
	BookID      *int64    `json:"bookId"`
	EventType   string    `json:"eventType"`
	SourceTitle string    `json:"sourceTitle"`
	Data        string    `json:"data"`
	CreatedAt   time.Time `json:"createdAt"`
}

const (
	HistoryEventGrabbed             = "grabbed"
	HistoryEventImportFailed        = "importFailed"
	HistoryEventBookImported        = "bookImported"
	HistoryEventDownloadFailed      = "downloadFailed"
	HistoryEventBookRenamed         = "bookRenamed"
	HistoryEventDownloadFolderImport = "downloadFolderImported"
)
