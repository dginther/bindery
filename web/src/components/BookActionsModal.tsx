import { useState } from 'react'
import { api, Book, SearchResult } from '../api/client'

interface Props {
  book: Book
  onClose: () => void
  onUpdated: (b: Book) => void
}

export default function BookActionsModal({ book, onClose, onUpdated }: Props) {
  const [mediaType, setMediaType] = useState(book.mediaType || 'ebook')
  const [savingType, setSavingType] = useState(false)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [grabbing, setGrabbing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const saveMediaType = async (next: 'ebook' | 'audiobook') => {
    setSavingType(true)
    setError(null)
    try {
      const updated = await api.updateBook(book.id, { mediaType: next })
      setMediaType(next)
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSavingType(false)
    }
  }

  const runSearch = async () => {
    setSearching(true)
    setResults(null)
    setError(null)
    try {
      const r = await api.searchBook(book.id)
      setResults(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const grab = async (r: SearchResult) => {
    setGrabbing(r.guid)
    setError(null)
    try {
      await api.grab({
        guid: r.guid,
        title: r.title,
        nzbUrl: r.nzbUrl,
        size: r.size,
        bookId: book.id,
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grab failed')
    } finally {
      setGrabbing(null)
    }
  }

  const formatSize = (n: number) => {
    if (n > 1073741824) return (n / 1073741824).toFixed(1) + ' GB'
    if (n > 1048576) return (n / 1048576).toFixed(1) + ' MB'
    return (n / 1024).toFixed(0) + ' KB'
  }

  const typeBtn = (type: 'ebook' | 'audiobook') =>
    `flex-1 py-2 text-sm font-medium rounded transition-colors ${
      mediaType === type
        ? 'bg-emerald-600 text-white'
        : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-700'
    }`

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-start gap-4">
          {book.imageUrl && (
            <img src={book.imageUrl} alt="" className="w-16 h-24 object-cover rounded flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold truncate">{book.title}</h3>
            {book.author?.authorName && (
              <p className="text-xs text-slate-600 dark:text-zinc-500">{book.author.authorName}</p>
            )}
            {book.releaseDate && (
              <p className="text-xs text-slate-600 dark:text-zinc-500">{new Date(book.releaseDate).getFullYear()}</p>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs text-slate-600 dark:text-zinc-400 mb-2">Format</label>
            <div className="flex gap-2">
              <button onClick={() => saveMediaType('ebook')} disabled={savingType} className={typeBtn('ebook')}>
                📖 Ebook
              </button>
              <button onClick={() => saveMediaType('audiobook')} disabled={savingType} className={typeBtn('audiobook')}>
                🎧 Audiobook
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={runSearch}
              disabled={searching}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-sm font-medium"
            >
              {searching ? 'Searching all indexers…' : `Search ${mediaType === 'audiobook' ? 'audiobook' : 'ebook'} indexers`}
            </button>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-900 rounded text-xs text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {results !== null && results.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-600 dark:text-zinc-500">
              No results on any indexer.
            </div>
          )}

          {results !== null && results.length > 0 && (
            <div className="space-y-1">
              {results.slice(0, 15).map(r => (
                <div key={r.guid} className="flex items-center justify-between p-2 bg-slate-200/50 dark:bg-zinc-800/50 rounded text-xs">
                  <div className="min-w-0 mr-3">
                    <span className="truncate block">{r.title}</span>
                    <span className="text-slate-500 dark:text-zinc-500 truncate block">
                      {r.indexerName} · {formatSize(r.size)} · {r.grabs} grabs
                    </span>
                  </div>
                  <button
                    onClick={() => grab(r)}
                    disabled={grabbing !== null}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-[11px] font-medium flex-shrink-0"
                  >
                    {grabbing === r.guid ? 'Grabbing…' : 'Grab'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
