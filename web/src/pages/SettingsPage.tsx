import { useEffect, useState } from 'react'
import { api, Indexer, DownloadClient } from '../api/client'

export default function SettingsPage() {
  const [tab, setTab] = useState<'indexers' | 'clients'>('indexers')
  const [indexers, setIndexers] = useState<Indexer[]>([])
  const [clients, setClients] = useState<DownloadClient[]>([])
  const [showAddIndexer, setShowAddIndexer] = useState(false)
  const [showAddClient, setShowAddClient] = useState(false)

  useEffect(() => {
    api.listIndexers().then(setIndexers).catch(console.error)
    api.listDownloadClients().then(setClients).catch(console.error)
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('indexers')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'indexers' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Indexers
        </button>
        <button
          onClick={() => setTab('clients')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'clients' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Download Clients
        </button>
      </div>

      {tab === 'indexers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Indexers</h3>
            <button
              onClick={() => setShowAddIndexer(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium"
            >
              + Add Indexer
            </button>
          </div>
          {indexers.length === 0 ? (
            <p className="text-zinc-500 text-sm">No indexers configured. Add a Newznab indexer to search for books.</p>
          ) : (
            <div className="space-y-2">
              {indexers.map(idx => (
                <div key={idx.id} className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900">
                  <div>
                    <h4 className="font-medium text-sm">{idx.name}</h4>
                    <p className="text-xs text-zinc-500">{idx.url}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${idx.enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {idx.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await api.testIndexer(idx.id)
                          alert('Connection successful!')
                        } catch (err: unknown) {
                          alert('Test failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
                        }
                      }}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Test
                    </button>
                    <button
                      onClick={async () => {
                        await api.deleteIndexer(idx.id)
                        setIndexers(indexers.filter(i => i.id !== idx.id))
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showAddIndexer && (
            <AddIndexerForm
              onClose={() => setShowAddIndexer(false)}
              onAdded={(idx) => { setIndexers([...indexers, idx]); setShowAddIndexer(false) }}
            />
          )}
        </div>
      )}

      {tab === 'clients' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Download Clients</h3>
            <button
              onClick={() => setShowAddClient(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-medium"
            >
              + Add Client
            </button>
          </div>
          {clients.length === 0 ? (
            <p className="text-zinc-500 text-sm">No download clients configured. Add SABnzbd to enable downloads.</p>
          ) : (
            <div className="space-y-2">
              {clients.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900">
                  <div>
                    <h4 className="font-medium text-sm">{c.name}</h4>
                    <p className="text-xs text-zinc-500">{c.host}:{c.port} ({c.category})</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${c.enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {c.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await api.testDownloadClient(c.id)
                          alert('Connection successful!')
                        } catch (err: unknown) {
                          alert('Test failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
                        }
                      }}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Test
                    </button>
                    <button
                      onClick={async () => {
                        await api.deleteDownloadClient(c.id)
                        setClients(clients.filter(x => x.id !== c.id))
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showAddClient && (
            <AddClientForm
              onClose={() => setShowAddClient(false)}
              onAdded={(c) => { setClients([...clients, c]); setShowAddClient(false) }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function AddIndexerForm({ onClose, onAdded }: { onClose: () => void; onAdded: (idx: Indexer) => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  const submit = async () => {
    const idx = await api.addIndexer({ name, url, apiKey, type: 'newznab', categories: [7000, 7020], enabled: true })
    onAdded(idx)
  }

  return (
    <div className="mt-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50 space-y-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. NZBGeek)" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (e.g. https://api.nzbgeek.info)" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-zinc-400">Cancel</button>
        <button onClick={submit} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">Save</button>
      </div>
    </div>
  )
}

function AddClientForm({ onClose, onAdded }: { onClose: () => void; onAdded: (c: DownloadClient) => void }) {
  const [name, setName] = useState('SABnzbd')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('8080')
  const [apiKey, setApiKey] = useState('')
  const [category, setCategory] = useState('books')

  const submit = async () => {
    const c = await api.addDownloadClient({
      name, host, port: parseInt(port), apiKey, category, type: 'sabnzbd', enabled: true,
    })
    onAdded(c)
  }

  return (
    <div className="mt-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50 space-y-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <input value={host} onChange={e => setHost(e.target.value)} placeholder="Host" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
        <input value={port} onChange={e => setPort(e.target.value)} placeholder="Port" className="w-24 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
      </div>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
      <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-zinc-400">Cancel</button>
        <button onClick={submit} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">Save</button>
      </div>
    </div>
  )
}
