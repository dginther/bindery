package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/vavallee/bindery/internal/db"
	"github.com/vavallee/bindery/internal/models"
)

type BookHandler struct {
	books *db.BookRepo
}

func NewBookHandler(books *db.BookRepo) *BookHandler {
	return &BookHandler{books: books}
}

func (h *BookHandler) List(w http.ResponseWriter, r *http.Request) {
	var books []models.Book
	var err error

	authorID := r.URL.Query().Get("authorId")
	status := r.URL.Query().Get("status")

	switch {
	case authorID != "":
		id, _ := strconv.ParseInt(authorID, 10, 64)
		books, err = h.books.ListByAuthor(r.Context(), id)
	case status != "":
		books, err = h.books.ListByStatus(r.Context(), status)
	default:
		books, err = h.books.List(r.Context())
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if books == nil {
		books = []models.Book{}
	}
	writeJSON(w, http.StatusOK, books)
}

func (h *BookHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}

	book, err := h.books.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if book == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "book not found"})
		return
	}
	writeJSON(w, http.StatusOK, book)
}

func (h *BookHandler) Update(w http.ResponseWriter, r *http.Request) {
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

	var req struct {
		Monitored *bool   `json:"monitored"`
		Status    *string `json:"status"`
		FilePath  *string `json:"filePath"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.Monitored != nil {
		book.Monitored = *req.Monitored
	}
	if req.Status != nil {
		book.Status = *req.Status
	}
	if req.FilePath != nil {
		book.FilePath = *req.FilePath
	}

	if err := h.books.Update(r.Context(), book); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, book)
}

func (h *BookHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	if err := h.books.Delete(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BookHandler) ListWanted(w http.ResponseWriter, r *http.Request) {
	books, err := h.books.ListByStatus(r.Context(), models.BookStatusWanted)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if books == nil {
		books = []models.Book{}
	}
	writeJSON(w, http.StatusOK, books)
}
