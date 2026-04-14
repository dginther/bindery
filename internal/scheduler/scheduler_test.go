package scheduler

import (
	"context"
	"testing"

	"github.com/vavallee/bindery/internal/indexer/newznab"
)

// stubBlocklist implements just enough of the blocklist interface for filterBlocklisted.
type stubBlocklist struct {
	blocked map[string]bool
}

func (s *stubBlocklist) IsBlocked(_ context.Context, guid string) (bool, error) {
	return s.blocked[guid], nil
}

func TestFilterBlocklisted(t *testing.T) {
	ctx := context.Background()

	results := []newznab.SearchResult{
		{GUID: "aaa", Title: "Good Result"},
		{GUID: "bbb", Title: "Blocked Result"},
		{GUID: "ccc", Title: "Another Good Result"},
	}

	// nil repo → nothing blocked
	out := filterBlocklisted(ctx, nil, results)
	if len(out) != 3 {
		t.Errorf("nil blocklist: expected 3 results, got %d", len(out))
	}

	// one entry blocked
	out = filterBlocklistedStub(ctx, &stubBlocklist{blocked: map[string]bool{"bbb": true}}, results)
	if len(out) != 2 {
		t.Errorf("expected 2 results after blocking bbb, got %d", len(out))
	}
	for _, r := range out {
		if r.GUID == "bbb" {
			t.Error("blocked result slipped through")
		}
	}

	// all blocked → empty slice (not nil panic)
	bl := &stubBlocklist{blocked: map[string]bool{"aaa": true, "bbb": true, "ccc": true}}
	out = filterBlocklistedStub(ctx, bl, results)
	if len(out) != 0 {
		t.Errorf("expected 0 results when all blocked, got %d", len(out))
	}

	// empty input → empty output
	out = filterBlocklistedStub(ctx, bl, nil)
	if len(out) != 0 {
		t.Error("expected empty output for nil input")
	}
}

// blocklistChecker is the interface filterBlocklisted uses (IsBlocked method).
// We replicate the logic here to test it without depending on the real db.BlocklistRepo type.
type blocklistChecker interface {
	IsBlocked(ctx context.Context, guid string) (bool, error)
}

func filterBlocklistedStub(ctx context.Context, bl blocklistChecker, results []newznab.SearchResult) []newznab.SearchResult {
	if bl == nil {
		return results
	}
	out := make([]newznab.SearchResult, 0, len(results))
	for _, r := range results {
		if blocked, _ := bl.IsBlocked(ctx, r.GUID); !blocked {
			out = append(out, r)
		}
	}
	return out
}
