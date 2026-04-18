import { useState } from 'react'
import { useSearch, useQuery, useStreamSearch } from '@semilayer/react'
import type { QueryParams } from '@semilayer/client'
import { LENS } from './beam'

type Mode = 'search' | 'query' | 'stream'

type Row = Record<string, unknown>

/**
 * Parse a comma-separated `field=value` filter into a `where` clause.
 * Values are JSON-parsed when possible so `true`, numbers, and quoted
 * strings behave naturally; everything else stays a bare string.
 *
 *   ""                                  → null (no filter, all rows)
 *   "category=snacks"                   → { category: "snacks" }
 *   "vegetarian=true, price=5"          → { vegetarian: true, price: 5 }
 */
function parseFilter(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const out: Record<string, unknown> = {}
  for (const pair of trimmed.split(',').map((s) => s.trim()).filter(Boolean)) {
    const eq = pair.indexOf('=')
    if (eq < 0) throw new Error(`Expected "field=value", got "${pair}"`)
    const key = pair.slice(0, eq).trim()
    if (!key) throw new Error(`Missing field name in "${pair}"`)
    const rawValue = pair.slice(eq + 1).trim()
    let value: unknown = rawValue
    try {
      value = JSON.parse(rawValue)
    } catch {
      /* keep as bare string */
    }
    out[key] = value
  }
  return out
}

export function App() {
  const [mode, setMode] = useState<Mode>('search')
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [queryWhere, setQueryWhere] = useState<Record<string, unknown> | null>(null)
  const [queryRun, setQueryRun] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const search = useSearch<Row>(
    LENS,
    mode === 'search' && submitted ? { query: submitted, limit: 12 } : null,
  )

  const stream = useStreamSearch<Row>(
    LENS,
    mode === 'stream' && submitted ? { query: submitted, limit: 50 } : null,
  )

  const queryParams: QueryParams = {
    limit: 12,
    orderBy: { field: 'id', dir: 'desc' },
    ...(queryWhere ? { where: queryWhere } : {}),
  }
  const query = useQuery<Row>(LENS, queryParams, {
    enabled: mode === 'query' && queryRun,
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParseError(null)
    if (mode === 'query') {
      try {
        setQueryWhere(parseFilter(draft))
        setQueryRun(true)
      } catch (err) {
        setParseError(err instanceof Error ? err.message : String(err))
      }
    } else {
      setSubmitted(draft)
    }
  }

  const onModeChange = (next: Mode) => {
    setMode(next)
    setDraft('')
    setSubmitted(null)
    setParseError(null)
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
              ? 'Filter — e.g. category=snacks, vegetarian=true (blank = all rows)'
              : mode === 'stream'
                ? 'Stream results as they arrive — e.g. "hearty fall stew"'
                : 'Search semantically — e.g. "quick weeknight dinner"'
          }
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

      <ErrorBanner
        mode={mode}
        search={search}
        stream={stream}
        query={query}
        parseError={parseError}
      />
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
  parseError,
}: {
  mode: Mode
  search: ReturnType<typeof useSearch>
  stream: ReturnType<typeof useStreamSearch>
  query: ReturnType<typeof useQuery>
  parseError: string | null
}) {
  const message =
    parseError ??
    (mode === 'search'
      ? search.error?.message
      : mode === 'stream'
        ? stream.error?.message
        : query.error?.message)
  if (!message) return null
  return <div className="error">{message}</div>
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
