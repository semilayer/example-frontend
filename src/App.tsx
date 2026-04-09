import { useState } from 'react'
import { beam, LENS } from './beam'
import type { SearchResult } from '@semilayer/client'

type Mode = 'search' | 'query'

type Row = Record<string, unknown>

export function App() {
  const [mode, setMode] = useState<Mode>('search')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [meta, setMeta] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])
    setRows([])
    setMeta('')
    try {
      if (mode === 'search') {
        const res = await beam.search(LENS, { query: q, limit: 12 })
        setResults(res.results)
        setMeta(`${res.meta.count} results in ${res.meta.durationMs}ms`)
      } else {
        // Structured query — no embedding, just filter/sort/paginate the lens.
        // Tweak `where` / `orderBy` / `limit` for your own schema.
        const res = await beam.query<Row>(LENS, { limit: 12, orderBy: { field: 'id', dir: 'desc' } })
        setRows(res.rows)
        setMeta(`${res.meta.count} rows in ${res.meta.durationMs}ms`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>SemiLayer example</h1>
        <p className="sub">
          Lens: <code>{LENS}</code> · mode:{' '}
          <button className={mode === 'search' ? 'on' : ''} onClick={() => setMode('search')}>
            search
          </button>{' '}
          <button className={mode === 'query' ? 'on' : ''} onClick={() => setMode('query')}>
            query
          </button>
        </p>
      </header>

      <form onSubmit={run} className="bar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            mode === 'search'
              ? 'Search semantically — e.g. "quick weeknight dinner"'
              : 'Query ignores this field — edit App.tsx to add filters'
          }
          disabled={mode === 'query'}
        />
        <button type="submit" disabled={loading || (mode === 'search' && !q.trim())}>
          {loading ? '...' : mode === 'search' ? 'Search' : 'Run query'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {meta && <div className="meta">{meta}</div>}

      {mode === 'search' ? (
        <ul className="grid">
          {results.map((r) => (
            <li key={r.id} className="card">
              <div className="score">{Math.round(r.score * 100)}%</div>
              <pre>{JSON.stringify(r.metadata, null, 2)}</pre>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid">
          {rows.map((row, i) => (
            <li key={i} className="card">
              <pre>{JSON.stringify(row, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
