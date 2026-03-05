import type { CacheEntry } from '../types'

// ─── In-memory cache ─────────────────────────────────────────────────────────

const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function cacheSet<T>(key: string, data: T, ttl: number): void {
  store.set(key, { data, timestamp: Date.now(), ttl } as CacheEntry<T>)
}

// ─── Fetch with caching ───────────────────────────────────────────────────────

export async function fetchCached<T>(
  key: string,
  url: string,
  ttlMs: number,
  options?: RequestInit,
): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== null) return cached

  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} fetching ${url}: ${body.slice(0, 200)}`)
  }

  const data: T = await res.json()
  cacheSet(key, data, ttlMs)
  return data
}

// ─── GitHub API ───────────────────────────────────────────────────────────────

const GH_BASE = 'https://api.github.com'
// Five-minute TTL for most GitHub calls; longer for starred repos list
const GH_TTL = 5 * 60 * 1000
const GH_STARRED_TTL = 15 * 60 * 1000

function ghHeaders(): HeadersInit {
  // If a read-only public PAT is stored in localStorage under 'gh_token',
  // use it to raise the rate-limit from 60 → 5 000 req/hr.
  const token = localStorage.getItem('gh_token')
  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

export async function ghFetch<T>(path: string, ttl = GH_TTL): Promise<T> {
  return fetchCached<T>(`gh:${path}`, `${GH_BASE}${path}`, ttl, {
    headers: ghHeaders(),
  })
}

export async function ghFetchStarred(username: string): Promise<unknown[]> {
  const cacheKey = `gh:starred:${username}`
  const cached = cacheGet<unknown[]>(cacheKey)
  if (cached) return cached

  const perPage = 100
  let page = 1
  const results: unknown[] = []

  while (page <= 10) {           // cap at 1 000 repos
    const url = `${GH_BASE}/users/${username}/starred?per_page=${perPage}&page=${page}`
    const headers = { Accept: 'application/json', ...ghHeaders() }
    const res = await fetch(url, { headers })

    if (res.status === 403) break   // rate-limited; return what we have
    if (!res.ok) break

    const page_data: unknown[] = await res.json()
    results.push(...page_data)
    if (page_data.length < perPage) break
    page++
  }

  cacheSet(cacheKey, results, GH_STARRED_TTL)
  return results
}

// ─── Polymarket Gamma API ─────────────────────────────────────────────────────

const POLY_BASE = 'https://gamma-api.polymarket.com'
const POLY_TTL = 90 * 1000    // 90-second TTL; markets update frequently

export async function polyFetch<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString()
  const url = `${POLY_BASE}${path}${qs ? `?${qs}` : ''}`
  return fetchCached<T>(`poly:${path}:${qs}`, url, POLY_TTL)
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}

export function formatVolume(raw: string | number): string {
  const n = typeof raw === 'string' ? parseFloat(raw) : raw
  if (isNaN(n)) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function pct(price: string | number): string {
  const n = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(n)) return '—'
  return `${Math.round(n * 100)}%`
}
