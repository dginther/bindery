import type { View } from './useView'

interface Props {
  view: View
  onChange: (v: View) => void
}

export default function ViewToggle({ view, onChange }: Props) {
  const btn = (v: View) =>
    `px-2 py-1 rounded text-xs font-medium transition-colors ${
      view === v
        ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white'
        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
    }`
  return (
    <div className="inline-flex gap-1 border border-slate-200 dark:border-zinc-800 rounded p-0.5">
      <button onClick={() => onChange('grid')} className={btn('grid')} title="Grid view">▦</button>
      <button onClick={() => onChange('table')} className={btn('table')} title="Table view">☰</button>
    </div>
  )
}
