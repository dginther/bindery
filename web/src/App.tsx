import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from './api/client'
import AuthorsPage from './pages/AuthorsPage'
import AuthorDetailPage from './pages/AuthorDetailPage'
import BooksPage from './pages/BooksPage'
import BookDetailPage from './pages/BookDetailPage'
import WantedPage from './pages/WantedPage'
import QueuePage from './pages/QueuePage'
import SettingsPage from './pages/SettingsPage'
import HistoryPage from './pages/HistoryPage'
import SeriesPage from './pages/SeriesPage'
import CalendarPage from './pages/CalendarPage'
import BlocklistPage from './pages/BlocklistPage'

const NAV_ITEMS = [
  { to: '/', label: 'Authors', end: true },
  { to: '/books', label: 'Books' },
  { to: '/wanted', label: 'Wanted' },
  { to: '/queue', label: 'Queue' },
  { to: '/history', label: 'History' },
  { to: '/series', label: 'Series' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/blocklist', label: 'Blocklist' },
  { to: '/settings', label: 'Settings' },
]

interface CatalogCounts {
  authors: number | null
  books: number | null
  wanted: number | null
  queued: number | null
}

function AppShell() {
  const [version, setVersion] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [counts, setCounts] = useState<CatalogCounts>({ authors: null, books: null, wanted: null, queued: null })
  const location = useLocation()

  useEffect(() => {
    api.status().then(s => setVersion(s.version)).catch(() => {})
  }, [])

  // Refresh catalog counts on every route change — cheap enough for a
  // single-user tool, and the numbers reflect actions the user just took.
  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      api.listAuthors(),
      api.listBooks(),
      api.listWanted(),
      api.listQueue(),
    ]).then(([a, b, w, q]) => {
      if (cancelled) return
      setCounts({
        authors: a.status === 'fulfilled' ? a.value.length : null,
        books:   b.status === 'fulfilled' ? b.value.length : null,
        wanted:  w.status === 'fulfilled' ? w.value.length : null,
        queued:  q.status === 'fulfilled' ? q.value.length : null,
      })
    })
    return () => { cancelled = true }
  }, [location.pathname])

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase font-mono transition-colors ${
      isActive
        ? 'text-ink'
        : 'text-ink-3 hover:text-ink'
    }`

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-5 py-3 text-[11px] tracking-[0.18em] uppercase font-mono border-b border-rule/60 transition-colors ${
      isActive ? 'text-ink bg-paper-2' : 'text-ink-2 hover:text-ink'
    }`

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 bg-paper/92 backdrop-blur-sm border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Row 1 — masthead */}
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
              <ExLibrisSeal />
              <div className="flex flex-col leading-none">
                <span className="font-display text-[28px] tracking-tight"
                      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'wght' 400" }}>
                  Bindery
                </span>
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-ink-3 mt-0.5">
                  A personal library catalogue
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {version && (
                <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase text-ink-3">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  {/^\d+\.\d+/.test(version) ? `v${version}` : version}
                </span>
              )}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="md:hidden p-2 -mr-2 text-ink-2 hover:text-ink transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Row 2 — catalogue nav bar (desktop). Uppercase mono, hairline separators. */}
          <nav className="hidden md:flex items-center gap-0 -mx-3 border-t border-rule/50">
            {NAV_ITEMS.map((item, i) => (
              <div key={item.to} className="flex items-center">
                {i > 0 && <span className="text-rule select-none" aria-hidden>·</span>}
                <NavLink to={item.to} end={item.end} className={desktopLinkClass}>
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span className="absolute left-3 right-3 -bottom-px h-[2px] bg-accent" aria-hidden />
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            ))}
          </nav>

          {/* Row 3 — catalog counts bar. Always visible on desktop, hidden on mobile. */}
          <div className="hidden md:flex items-center justify-start gap-6 py-2 border-t border-rule/50 catalog-bar">
            <CatalogCount label="Authors" value={counts.authors} />
            <Sep />
            <CatalogCount label="Books" value={counts.books} />
            <Sep />
            <CatalogCount label="Wanted" value={counts.wanted} />
            <Sep />
            <CatalogCount label="Queued" value={counts.queued} />
            <span className="ml-auto font-mono text-[10px] tracking-[0.18em] uppercase text-ink-3 hidden lg:inline">
              Est. MMXXVI
            </span>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-rule bg-paper">
            <nav>
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={mobileLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between px-5 py-3 catalog-bar">
              <CatalogCount label="Authors" value={counts.authors} />
              <CatalogCount label="Books" value={counts.books} />
              <CatalogCount label="Wanted" value={counts.wanted} />
              <CatalogCount label="Queued" value={counts.queued} />
            </div>
            {version && (
              <div className="px-5 py-2 text-[10px] tracking-[0.18em] uppercase font-mono text-ink-3 border-t border-rule/60">
                {/^\d+\.\d+/.test(version) ? `v${version}` : version}
              </div>
            )}
          </div>
        )}
      </header>

      {/* key on pathname gives each route a fresh page-in animation */}
      <main
        key={location.pathname}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 animate-page-in"
      >
        <Routes>
          <Route path="/" element={<AuthorsPage />} />
          <Route path="/author/:id" element={<AuthorDetailPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/wanted" element={<WantedPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/series" element={<SeriesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/blocklist" element={<BlocklistPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <footer className="border-t border-rule mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-3">
            Colophon · Set in Fraunces &amp; IBM Plex · Bound by <span className="text-ink-2">vavallee</span>
          </span>
          <a
            href="https://github.com/vavallee"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-ink-3 hover:text-ink transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  )
}

function Sep() {
  return <span className="text-rule-2 select-none" aria-hidden>·</span>
}

function CatalogCount({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span>{label}</span>
      <span className="count">{value == null ? '—' : value.toLocaleString()}</span>
    </span>
  )
}

/*
 * Ex Libris seal — an inline SVG "bookplate" stamp. Used as the brand mark
 * in the masthead. Circular wordmark with a ligature-style "B" at the
 * centre, hand-drawn rule, hairline outer ring. The whole thing rotates
 * 1° on hover — the only transform on the page that implies personality
 * rather than state.
 */
function ExLibrisSeal() {
  return (
    <span className="relative inline-flex items-center justify-center w-12 h-12 rounded-full transition-transform duration-500 ease-out group-hover:rotate-[2deg]">
      <svg viewBox="0 0 64 64" className="w-full h-full text-ink" aria-hidden>
        {/* Outer hairline rings */}
        <circle cx="32" cy="32" r="30"   fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.85" />
        <circle cx="32" cy="32" r="27.5" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.5" />
        {/* Curved wordmark — top and bottom */}
        <defs>
          <path id="seal-top"    d="M 32 5 a 27 27 0 0 1 0 54" fill="none" />
          <path id="seal-bot"    d="M 32 59 a 27 27 0 0 1 0 -54" fill="none" />
        </defs>
        <text fill="currentColor" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '6.4px', letterSpacing: '0.26em' }}>
          <textPath href="#seal-top" startOffset="50%" textAnchor="middle">BINDERY</textPath>
        </text>
        <text fill="currentColor" opacity="0.7" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '5.2px', letterSpacing: '0.32em' }}>
          <textPath href="#seal-bot" startOffset="50%" textAnchor="middle">EX LIBRIS</textPath>
        </text>
        {/* Centre monogram — Fraunces serif B */}
        <text
          x="32" y="39.5"
          textAnchor="middle"
          fill="currentColor"
          style={{
            fontFamily: "'Fraunces Variable', 'Fraunces', Georgia, serif",
            fontSize: '22px',
            fontVariationSettings: "'opsz' 144, 'SOFT' 60, 'wght' 500",
          }}
        >
          B
        </text>
        {/* Decorative flourishes left/right of monogram */}
        <path d="M 12 32 h 5" stroke="currentColor" strokeWidth="0.6" />
        <path d="M 47 32 h 5" stroke="currentColor" strokeWidth="0.6" />
      </svg>
    </span>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
