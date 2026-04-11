package importer

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/vavallee/bindery/internal/models"
)

const defaultNamingTemplate = "{Author}/{Title} ({Year})/{Title} - {Author}.{ext}"

// Renamer moves and renames imported book files according to a naming template.
type Renamer struct {
	template string
}

// NewRenamer creates a renamer with the given naming template.
// If template is empty, the default template is used.
func NewRenamer(template string) *Renamer {
	if template == "" {
		template = defaultNamingTemplate
	}
	return &Renamer{template: template}
}

// DestPath computes the destination path for a book file.
func (r *Renamer) DestPath(rootFolder string, author *models.Author, book *models.Book, srcPath string) string {
	ext := strings.TrimPrefix(filepath.Ext(srcPath), ".")

	year := ""
	if book.ReleaseDate != nil {
		year = fmt.Sprintf("%d", book.ReleaseDate.Year())
	}

	authorName := "Unknown Author"
	if author != nil {
		authorName = author.Name
	}

	result := r.template
	result = strings.ReplaceAll(result, "{Author}", sanitizePath(authorName))
	result = strings.ReplaceAll(result, "{SortAuthor}", sanitizePath(authorSortName(authorName)))
	result = strings.ReplaceAll(result, "{Title}", sanitizePath(book.Title))
	result = strings.ReplaceAll(result, "{Year}", year)
	result = strings.ReplaceAll(result, "{ext}", ext)

	return filepath.Join(rootFolder, result)
}

// MoveFile atomically copies a file to the destination and then removes the source.
// This handles cross-filesystem moves (e.g., NFS download dir → NFS library).
func MoveFile(src, dst string) error {
	// Ensure destination directory exists
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return fmt.Errorf("create dir: %w", err)
	}

	// Try rename first (same filesystem, instant)
	if err := os.Rename(src, dst); err == nil {
		return nil
	}

	// Cross-filesystem: copy then delete
	if err := copyFile(src, dst); err != nil {
		return fmt.Errorf("copy file: %w", err)
	}

	// Verify copy
	srcInfo, err := os.Stat(src)
	if err != nil {
		return fmt.Errorf("stat source: %w", err)
	}
	dstInfo, err := os.Stat(dst)
	if err != nil {
		return fmt.Errorf("stat destination: %w", err)
	}
	if srcInfo.Size() != dstInfo.Size() {
		os.Remove(dst)
		return fmt.Errorf("size mismatch: src=%d dst=%d", srcInfo.Size(), dstInfo.Size())
	}

	// Remove source
	return os.Remove(src)
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	return out.Sync()
}

func sanitizePath(s string) string {
	// Remove characters that are problematic in file paths
	replacer := strings.NewReplacer(
		"/", "-", "\\", "-", ":", "-", "*", "", "?", "",
		"\"", "", "<", "", ">", "", "|", "",
	)
	return strings.TrimSpace(replacer.Replace(s))
}

func authorSortName(name string) string {
	parts := strings.Fields(name)
	if len(parts) < 2 {
		return name
	}
	last := parts[len(parts)-1]
	rest := strings.Join(parts[:len(parts)-1], " ")
	return last + ", " + rest
}

// DefaultNamingTemplate returns the default naming template for reference.
func DefaultNamingTemplate() string {
	return defaultNamingTemplate
}

// NowYear returns the current year as a string, used as fallback.
func NowYear() string {
	return fmt.Sprintf("%d", time.Now().Year())
}
