package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/vavallee/bindery/internal/db"
)

type FileHandler struct {
	books *db.BookRepo
}

func NewFileHandler(books *db.BookRepo) *FileHandler {
	return &FileHandler{books: books}
}

// Download serves the book file for direct download.
func (h *FileHandler) Download(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	book, err := h.books.GetByID(r.Context(), id)
	if err != nil || book == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "book not found"})
		return
	}

	if book.FilePath == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "no file available for this book"})
		return
	}

	// Verify file exists
	info, err := os.Stat(book.FilePath)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "file not found on disk"})
		return
	}

	// Serve the file
	filename := filepath.Base(book.FilePath)
	w.Header().Set("Content-Disposition", "attachment; filename=\""+filename+"\"")
	w.Header().Set("Content-Length", strconv.FormatInt(info.Size(), 10))
	http.ServeFile(w, r, book.FilePath)
}
