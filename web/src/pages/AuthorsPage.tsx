import { useEffect, useState } from 'react'
import { api, Author } from '../api/client'
import AddAuthorModal from '../components/AddAuthorModal'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = () => {
    setLoading(true)
    api.listAuthors().then(setAuthors).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this author and all their books?')) return
    await api.deleteAuthor(id)
    load()
  }

  const handleToggleMonitored = async (author: Author) => {
    await api.updateAuthor(author.id, { monitored: !author.monitored } as Partial<Author>)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Authors</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-medium transition-colors"
        >
          + Add Author
        </button>
      </div>

      {loading ? (
        <div className="text-zinc-500">Loading...</div>
      ) : authors.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg mb-2">No authors yet</p>
          <p className="text-sm">Click "Add Author" to start tracking your favorite authors</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {authors.map(author => (
            <div key={author.id} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
              <div className="flex gap-3 p-4">
                {author.imageUrl ? (
                  <img src={author.imageUrl} alt={author.authorName} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xl font-bold text-zinc-600">
                    {author.authorName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{author.authorName}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {author.description || 'No description available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-t border-zinc-800">
                <button
                  onClick={() => handleToggleMonitored(author)}
                  className={`text-xs px-2 py-1 rounded ${author.monitored ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}
                >
                  {author.monitored ? 'Monitored' : 'Unmonitored'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => api.refreshAuthor(author.id).then(load)}
                    className="text-xs text-zinc-400 hover:text-white"
                    title="Refresh metadata"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => handleDelete(author.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddAuthorModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  )
}
