import { useState } from 'react'
import { useSearch, useQuery, useStreamSearch } from '@semilayer/react'
import { LENS } from './beam'

type Mode = 'search' | 'query' | 'stream'

type Row = Record<string, unknown>

export function App() {
  const [mode, setMode] = useState<Mode>('search')
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)

  const search = useSearch<Row>(
    LENS,
    mode === 'search' && submitted ? { query: submitted, limit: 12 } : null,
  )

  const stream = useStreamSearch<Row>(
    LENS,
    mode === 'stream' && submitted ? { query: submitted, limit: 50 } : null,
  )

  // Structured query — no embedding, just filter/sort/paginate the lens.
  // `enabled: false` keeps it idle until the user clicks "Run query".
  const query = useQuery<Row>(
    LENS,
    { limit: 12, orderBy: { field: 'id', dir: 'desc' } },
    { enabled: false },
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'query') {
      query.refetch()
    } else {
      setSubmitted(draft)
    }
  }

  const onModeChange = (next: Mode) => {
    setMode(next)
    setSubmitted(null)
  }

  return (
    <div className="app">
      <header>
        <h1>SemiLayer example</h1>
        <p className="sub">
          Lens: <code>{LENS}</code> · mode:{' '}
          <button className={mode === 'search' ? 'on' : ''} onClick={() => onModeChange('search')}>
            search
          </button>{' '}
          <button className={mode === 'query' ? 'on' : ''} onClick={() => onModeChange('query')}>
            query
          </button>{' '}
          <button className={mode === 'stream' ? 'on' : ''} onClick={() => onModeChange('stream')}>
            stream
          </button>
        </p>
      </header>

      <form onSubmit={onSubmit} className="bar">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            mode === 'query'
              ? 'Query ignores this field — edit App.tsx to add filters'
              : mode === 'stream'
                ? 'Stream results as they arrive — e.g. "hearty fall stew"'
                : 'Search semantically — e.g. "quick weeknight dinner"'
          }
          disabled={mode === 'query'}
        />
        <button
          type="submit"
          disabled={
            (mode === 'search' && (!draft.trim() || search.loading)) ||
            (mode === 'stream' && (!draft.trim() || (stream.loading && !stream.done))) ||
            (mode === 'query' && query.loading)
          }
        >
          {pendingLabel(mode, search, stream, query)}
        </button>
      </form>

      <ErrorBanner mode={mode} search={search} stream={stream} query={query} />
      <MetaLine mode={mode} search={search} stream={stream} query={query} />

      {mode === 'search' && (
        <ul className="grid">
          {search.data?.results.map((r) => (
            <li key={r.id} className="card">
              <div className="score">{Math.round(r.score * 100)}%</div>
              <pre>{JSON.stringify(r.metadata, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}

      {mode === 'stream' && (
        <ul className="grid">
          {stream.results.map((r) => (
            <li key={r.id} className="card">
              <div className="score">{Math.round(r.score * 100)}%</div>
              <pre>{JSON.stringify(r.metadata, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}

      {mode === 'query' && (
        <ul className="grid">
          {query.data?.rows.map((row, i) => (
            <li key={i} className="card">
              <pre>{JSON.stringify(row, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function pendingLabel(
  mode: Mode,
  search: ReturnType<typeof useSearch>,
  stream: ReturnType<typeof useStreamSearch>,
  query: ReturnType<typeof useQuery>,
) {
  if (mode === 'search') return search.loading ? '...' : 'Search'
  if (mode === 'stream') return stream.loading && !stream.done ? '...' : 'Stream'
  return query.loading ? '...' : 'Run query'
}

function ErrorBanner({
  mode,
  search,
  stream,
  query,
}: {
  mode: Mode
  search: ReturnType<typeof useSearch>
  stream: ReturnType<typeof useStreamSearch>
  query: ReturnType<typeof useQuery>
}) {
  const err =
    mode === 'search' ? search.error : mode === 'stream' ? stream.error : query.error
  if (!err) return null
  return <div className="error">{err.message}</div>
}

function MetaLine({
  mode,
  search,
  stream,
  query,
}: {
  mode: Mode
  search: ReturnType<typeof useSearch>
  stream: ReturnType<typeof useStreamSearch>
  query: ReturnType<typeof useQuery>
}) {
  if (mode === 'search' && search.data)
    return (
      <div className="meta">
        {search.data.meta.count} results in {search.data.meta.durationMs}ms
      </div>
    )
  if (mode === 'stream' && (stream.results.length || stream.done))
    return (
      <div className="meta">
        {stream.results.length} streamed{stream.done ? '' : '…'}
      </div>
    )
  if (mode === 'query' && query.data)
    return (
      <div className="meta">
        {query.data.meta.count} rows in {query.data.meta.durationMs}ms
      </div>
    )
  return null
}
