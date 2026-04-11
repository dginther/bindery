import { useEffect, useState } from 'react'
import { api, Book } from '../api/client'

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.listBooks().then(setBooks).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = filter
    ? books.filter(b => b.status === filter)
    : books

  const statusColors: Record<string, string> = {
    wanted: 'bg-amber-500/20 text-amber-400',
    downloading: 'bg-blue-500/20 text-blue-400',
    imported: 'bg-emerald-500/20 text-emerald-400',
    skipped: 'bg-zinc-700 text-zinc-400',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Books</h2>
        <div className="flex gap-2">
          {['', 'wanted', 'downloading', 'imported', 'skipped'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === s ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p>No books found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(book => (
            <div key={book.id} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden group">
              <div className="aspect-[2/3] bg-zinc-800 relative">
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 text-center">
                    <span className="text-sm text-zinc-600">{book.title}</span>
                  </div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[book.status] || 'bg-zinc-700 text-zinc-400'}`}>
                  {book.status}
                </div>
              </div>
              <div className="p-2">
                <h3 className="text-xs font-medium truncate" title={book.title}>{book.title}</h3>
                {book.releaseDate && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">{new Date(book.releaseDate).getFullYear()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
