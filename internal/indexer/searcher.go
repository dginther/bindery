package indexer

import (
	"context"
	"log/slog"
	"sort"
	"strings"
	"sync"

	"github.com/vavallee/bindery/internal/indexer/newznab"
	"github.com/vavallee/bindery/internal/models"
)

// Searcher coordinates searches across multiple Newznab indexers.
type Searcher struct{}

// NewSearcher creates a new multi-indexer searcher.
func NewSearcher() *Searcher {
	return &Searcher{}
}

// SearchBook queries all enabled indexers for a book and returns deduplicated, ranked results.
func (s *Searcher) SearchBook(ctx context.Context, indexers []models.Indexer, title, author string) []newznab.SearchResult {
	var (
		mu      sync.Mutex
		results []newznab.SearchResult
		wg      sync.WaitGroup
	)

	for _, idx := range indexers {
		if !idx.Enabled {
			continue
		}
		wg.Add(1)
		go func(idx models.Indexer) {
			defer wg.Done()

			client := newznab.New(idx.URL, idx.APIKey)
			var hits []newznab.SearchResult
			var err error

			// Try book-specific search first, then generic
			hits, err = client.BookSearch(ctx, title, author, idx.Categories)
			if err != nil {
				slog.Warn("indexer search failed", "indexer", idx.Name, "error", err)
				return
			}

			// Tag results with indexer info
			for i := range hits {
				hits[i].IndexerID = idx.ID
				hits[i].IndexerName = idx.Name
			}

			mu.Lock()
			results = append(results, hits...)
			mu.Unlock()

			slog.Debug("indexer returned results", "indexer", idx.Name, "count", len(hits))
		}(idx)
	}

	wg.Wait()

	results = dedupe(results)
	results = filterRelevant(results, title, author)
	rankResults(results)
	return results
}

// SearchQuery performs a generic text search across all enabled indexers.
func (s *Searcher) SearchQuery(ctx context.Context, indexers []models.Indexer, query string) []newznab.SearchResult {
	var (
		mu      sync.Mutex
		results []newznab.SearchResult
		wg      sync.WaitGroup
	)

	for _, idx := range indexers {
		if !idx.Enabled {
			continue
		}
		wg.Add(1)
		go func(idx models.Indexer) {
			defer wg.Done()

			client := newznab.New(idx.URL, idx.APIKey)
			hits, err := client.Search(ctx, query, idx.Categories)
			if err != nil {
				slog.Warn("indexer search failed", "indexer", idx.Name, "error", err)
				return
			}

			for i := range hits {
				hits[i].IndexerID = idx.ID
				hits[i].IndexerName = idx.Name
			}

			mu.Lock()
			results = append(results, hits...)
			mu.Unlock()
		}(idx)
	}

	wg.Wait()

	results = dedupe(results)
	rankResults(results)
	return results
}

// filterRelevant removes results that don't contain any significant word
// from the title or author name in the result title.
func filterRelevant(results []newznab.SearchResult, title, author string) []newznab.SearchResult {
	// Build keyword set from title and author (words >= 3 chars)
	var keywords []string
	for _, word := range strings.Fields(strings.ToLower(title)) {
		if len(word) >= 3 {
			keywords = append(keywords, word)
		}
	}
	for _, word := range strings.Fields(strings.ToLower(author)) {
		if len(word) >= 3 {
			keywords = append(keywords, word)
		}
	}

	if len(keywords) == 0 {
		return results
	}

	var filtered []newznab.SearchResult
	for _, r := range results {
		lower := strings.ToLower(r.Title)
		matches := 0
		for _, kw := range keywords {
			if strings.Contains(lower, kw) {
				matches++
			}
		}
		// Require at least 2 keyword matches, or 1 if there's only 1 keyword
		minMatches := 2
		if len(keywords) <= 2 {
			minMatches = 1
		}
		if matches >= minMatches {
			filtered = append(filtered, r)
		}
	}
	return filtered
}

func dedupe(results []newznab.SearchResult) []newznab.SearchResult {
	seen := make(map[string]bool)
	deduped := make([]newznab.SearchResult, 0, len(results))
	for _, r := range results {
		key := r.GUID
		if key == "" {
			key = r.Title + r.NZBURL
		}
		if seen[key] {
			continue
		}
		seen[key] = true
		deduped = append(deduped, r)
	}
	return deduped
}

func rankResults(results []newznab.SearchResult) {
	sort.Slice(results, func(i, j int) bool {
		// Prefer more grabs (indicates healthier NZB)
		if results[i].Grabs != results[j].Grabs {
			return results[i].Grabs > results[j].Grabs
		}
		// Then by size descending (larger usually means better quality)
		return results[i].Size > results[j].Size
	})
}
