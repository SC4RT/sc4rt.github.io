// ─── Routing ──────────────────────────────────────────────────────────────────

export type ModuleId = 'home' | 'world-signals' | 'github' | 'starred' | 'markets'

// ─── Polymarket ───────────────────────────────────────────────────────────────

export interface PolymarketMarket {
  id: string
  question: string
  outcomePrices: string   // JSON string e.g. '["0.72","0.28"]'
  outcomes: string        // JSON string e.g. '["Yes","No"]'
  volume: string
  liquidity: string
  closed: boolean
  endDate: string
}

export interface PolymarketEvent {
  id: string
  title: string
  slug: string
  startDate: string
  endDate: string
  description: string
  active: boolean
  closed: boolean
  markets: PolymarketMarket[]
  volume: string
  liquidity: string
  commentCount: number
  tags?: { id: string; label: string }[]
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

export interface GitHubUser {
  login: string
  name: string | null
  bio: string | null
  public_repos: number
  followers: number
  following: number
  avatar_url: string
  html_url: string
  created_at: string
  updated_at: string
  blog: string | null
  location: string | null
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  updated_at: string
  pushed_at: string
  html_url: string
  topics: string[]
  size: number
  fork: boolean
  private: boolean
  archived: boolean
  default_branch: string
}

export interface GitHubActivity {
  id: string
  type: string
  repo: { name: string }
  created_at: string
}

export interface GitHubCommitActivity {
  days: number[]
  total: number
  week: number
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}
