import { useEffect, useState } from 'react'

export type View = 'grid' | 'table'

/**
 * useView — persists a Grid/Table preference per page in localStorage.
 * Key format: `bindery.view.<page>` (e.g. bindery.view.books).
 */
export function useView(page: string, defaultView: View = 'grid') {
  const storageKey = `bindery.view.${page}`
  const [view, setViewState] = useState<View>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'grid' || saved === 'table') return saved
    } catch { /* ignore */ }
    return defaultView
  })

  useEffect(() => {
    try { localStorage.setItem(storageKey, view) } catch { /* ignore */ }
  }, [storageKey, view])

  return [view, setViewState] as const
}
