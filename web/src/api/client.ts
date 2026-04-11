const BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  // System
  health: () => request<{ status: string; version: string }>('/health'),
  status: () => request<{ version: string; commit: string; buildDate: string }>('/system/status'),

  // Metadata search
  searchAuthors: (term: string) => request<Author[]>(`/search/author?term=${encodeURIComponent(term)}`),
  searchBooks: (term: string) => request<Book[]>(`/search/book?term=${encodeURIComponent(term)}`),
  lookupISBN: (isbn: string) => request<Book>(`/book/lookup?isbn=${encodeURIComponent(isbn)}`),

  // Authors
  listAuthors: () => request<Author[]>('/author'),
  getAuthor: (id: number) => request<Author>(`/author/${id}`),
  addAuthor: (data: AddAuthorRequest) => request<Author>('/author', { method: 'POST', body: JSON.stringify(data) }),
  updateAuthor: (id: number, data: Partial<Author>) => request<Author>(`/author/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAuthor: (id: number) => request<void>(`/author/${id}`, { method: 'DELETE' }),
  refreshAuthor: (id: number) => request<void>(`/author/${id}/refresh`, { method: 'POST' }),

  // Books
  listBooks: (params?: { authorId?: number; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.authorId) q.set('authorId', String(params.authorId))
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return request<Book[]>(`/book${qs ? '?' + qs : ''}`)
  },
  getBook: (id: number) => request<Book>(`/book/${id}`),
  updateBook: (id: number, data: Partial<Book>) => request<Book>(`/book/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id: number) => request<void>(`/book/${id}`, { method: 'DELETE' }),
  searchBook: (id: number) => request<SearchResult[]>(`/book/${id}/search`, { method: 'POST' }),

  // Wanted
  listWanted: () => request<Book[]>('/wanted/missing'),

  // Indexers
  listIndexers: () => request<Indexer[]>('/indexer'),
  addIndexer: (data: Partial<Indexer>) => request<Indexer>('/indexer', { method: 'POST', body: JSON.stringify(data) }),
  updateIndexer: (id: number, data: Partial<Indexer>) => request<Indexer>(`/indexer/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIndexer: (id: number) => request<void>(`/indexer/${id}`, { method: 'DELETE' }),
  testIndexer: (id: number) => request<{ message: string }>(`/indexer/${id}/test`, { method: 'POST' }),
  searchIndexers: (q: string) => request<SearchResult[]>(`/indexer/search?q=${encodeURIComponent(q)}`),

  // Download clients
  listDownloadClients: () => request<DownloadClient[]>('/downloadclient'),
  addDownloadClient: (data: Partial<DownloadClient>) => request<DownloadClient>('/downloadclient', { method: 'POST', body: JSON.stringify(data) }),
  updateDownloadClient: (id: number, data: Partial<DownloadClient>) => request<DownloadClient>(`/downloadclient/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDownloadClient: (id: number) => request<void>(`/downloadclient/${id}`, { method: 'DELETE' }),
  testDownloadClient: (id: number) => request<{ message: string }>(`/downloadclient/${id}/test`, { method: 'POST' }),

  // Queue
  listQueue: () => request<QueueItem[]>('/queue'),
  grab: (data: GrabRequest) => request<Download>('/queue/grab', { method: 'POST', body: JSON.stringify(data) }),
  deleteFromQueue: (id: number) => request<void>(`/queue/${id}`, { method: 'DELETE' }),
}

// Types
export interface Author {
  id: number
  foreignAuthorId: string
  authorName: string
  sortName: string
  description: string
  imageUrl: string
  monitored: boolean
  books?: Book[]
}

export interface Book {
  id: number
  foreignBookId: string
  authorId: number
  title: string
  description: string
  imageUrl: string
  releaseDate?: string
  genres: string[]
  monitored: boolean
  status: string
  filePath: string
  author?: Author
}

export interface Indexer {
  id: number
  name: string
  type: string
  url: string
  apiKey: string
  categories: number[]
  enabled: boolean
}

export interface DownloadClient {
  id: number
  name: string
  type: string
  host: string
  port: number
  apiKey: string
  useSsl: boolean
  category: string
  enabled: boolean
}

export interface Download {
  id: number
  guid: string
  title: string
  status: string
  size: number
}

export interface QueueItem extends Download {
  percentage?: string
  timeLeft?: string
}

export interface SearchResult {
  guid: string
  indexerName: string
  title: string
  size: number
  nzbUrl: string
  grabs: number
  pubDate: string
}

export interface AddAuthorRequest {
  foreignAuthorId: string
  authorName: string
  monitored: boolean
  searchOnAdd: boolean
}

export interface GrabRequest {
  guid: string
  title: string
  nzbUrl: string
  size: number
  bookId?: number
  indexerId?: number
}
