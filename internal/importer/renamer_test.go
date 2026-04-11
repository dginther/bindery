package importer

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/vavallee/bindery/internal/models"
)

func TestRenamerDestPath(t *testing.T) {
	r := NewRenamer("")
	releaseDate := time.Date(2016, 7, 26, 0, 0, 0, 0, time.UTC)

	author := &models.Author{Name: "Test Author"}
	book := &models.Book{
		Title:       "Dark Matter",
		ReleaseDate: &releaseDate,
	}

	got := r.DestPath("/books", author, book, "/downloads/complete/something.epub")
	want := filepath.Join("/books", "Test Author", "Dark Matter (2016)", "Dark Matter - Test Author.epub")
	if got != want {
		t.Errorf("got  %q\nwant %q", got, want)
	}
}

func TestRenamerNoYear(t *testing.T) {
	r := NewRenamer("")
	author := &models.Author{Name: "Author"}
	book := &models.Book{Title: "Book Title"}

	got := r.DestPath("/lib", author, book, "file.pdf")
	want := filepath.Join("/lib", "Author", "Book Title ()", "Book Title - Author.pdf")
	if got != want {
		t.Errorf("got  %q\nwant %q", got, want)
	}
}

func TestRenamerSanitizesPath(t *testing.T) {
	r := NewRenamer("")
	author := &models.Author{Name: "Author: Bad/Name"}
	book := &models.Book{Title: "Title? With <Bad> Chars"}

	got := r.DestPath("/lib", author, book, "test.epub")
	// Verify path doesn't contain dangerous characters in the filename portion
	base := filepath.Base(got)
	for _, bad := range []string{":", "?", "<", ">"} {
		if contains(base, bad) {
			t.Errorf("path %q contains bad char %q", got, bad)
		}
	}
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && filepath.Base(s) != "" && stringContains(s, substr)
}

func stringContains(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func TestMoveFile(t *testing.T) {
	// Create temp source file
	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "source.epub")
	if err := os.WriteFile(srcPath, []byte("test content"), 0644); err != nil {
		t.Fatal(err)
	}

	dstPath := filepath.Join(tmpDir, "dest", "subdir", "moved.epub")

	err := MoveFile(srcPath, dstPath)
	if err != nil {
		t.Fatalf("move: %v", err)
	}

	// Source should not exist
	if _, err := os.Stat(srcPath); !os.IsNotExist(err) {
		t.Error("source file should be deleted after move")
	}

	// Dest should exist with correct content
	content, err := os.ReadFile(dstPath)
	if err != nil {
		t.Fatalf("read dest: %v", err)
	}
	if string(content) != "test content" {
		t.Errorf("content mismatch: got %q", string(content))
	}
}
