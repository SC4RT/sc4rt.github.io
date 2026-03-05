import { ghFetch, relativeTime } from '../lib/api'
import type { GitHubUser, GitHubRepo, GitHubActivity } from '../types'

const USERNAME = 'SC4RT'

// GitHub language colour palette (a curated subset)
const LANG_COLOURS: Record<string, string> = {
  TypeScript:  '#3178c6',
  JavaScript:  '#f1e05a',
  Python:      '#3572A5',
  Rust:        '#dea584',
  Go:          '#00ADD8',
  'C++':       '#f34b7d',
  C:           '#555555',
  HTML:        '#e34c26',
  CSS:         '#563d7c',
  Shell:       '#89e051',
  Java:        '#b07219',
  Kotlin:      '#A97BFF',
  Swift:       '#F05138',
  Ruby:        '#701516',
  PHP:         '#4F5D95',
  'C#':        '#178600',
  Dart:        '#00B4AB',
  Lua:         '#000080',
  Haskell:     '#5e5086',
  Nix:         '#7e7eff',
  Vue:         '#41b883',
  Svelte:      '#ff3e00',
  Dockerfile:  '#384d54',
  Makefile:    '#427819',
  YAML:        '#cb171e',
}

function langColour(lang: string | null): string {
  if (!lang) return '#606080'
  return LANG_COLOURS[lang] ?? '#606080'
}

function escHtml(str: string): string {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Language Distribution ────────────────────────────────────────────────────

function computeLanguages(repos: GitHubRepo[]): { lang: string; count: number; pct: number }[] {
  const counts: Record<string, number> = {}
  for (const r of repos) {
    if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => ({ lang, count, pct: Math.round((count / total) * 100) }))
}

// ─── Card preview ─────────────────────────────────────────────────────────────

export async function renderGithubPreview(container: HTMLElement): Promise<void> {
  container.innerHTML = '<div class="loading-state"><div class="loading-row"></div><div class="loading-row"></div><div class="loading-row"></div></div>'

  try {
    const [user, repos] = await Promise.all([
      ghFetch<GitHubUser>(`/users/${USERNAME}`),
      ghFetch<GitHubRepo[]>(`/users/${USERNAME}/repos?sort=updated&per_page=6`),
    ])

    const langs = computeLanguages(repos)
    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${escHtml(user.avatar_url)}" width="36" height="36" style="border:1px solid var(--border-accent);filter:grayscale(0.3)" alt="" loading="lazy" />
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${escHtml(user.name ?? user.login)}</div>
            <div class="data-label">${user.public_repos} repos · ${formatNum(user.followers)} followers</div>
          </div>
        </div>

        ${langs.length ? `
          <div>
            <div class="gh-lang-bar" style="margin-bottom:6px">
              ${langs.map(l => `<div class="gh-lang-segment" style="flex:${l.pct};background:${langColour(l.lang)}"></div>`).join('')}
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              ${langs.slice(0, 4).map(l => `
                <span style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text-secondary)">
                  <span class="lang-dot" style="background:${langColour(l.lang)}"></span>${escHtml(l.lang)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="display:flex;gap:16px">
          <div class="ws-meta-item">
            <span class="data-label">Stars</span>
            <span class="data-value accent" style="font-size:11px">${formatNum(totalStars)}</span>
          </div>
          <div class="ws-meta-item">
            <span class="data-label">Repos</span>
            <span class="data-value" style="font-size:11px">${user.public_repos}</span>
          </div>
        </div>
      </div>
    `
  } catch {
    container.innerHTML = '<div class="error-state">GitHub API unreachable</div>'
  }
}

// ─── Full module ─────────────────────────────────────────────────────────────

export async function mountGithub(shell: HTMLElement): Promise<() => void> {
  shell.innerHTML = `
    <div id="gh-content">
      <!-- Left: Profile -->
      <div class="gh-panel" id="gh-profile-panel">
        <div class="gh-profile" id="gh-profile-inner">
          <div class="loading-state"><div class="loading-row"></div><div class="loading-row"></div></div>
        </div>
      </div>

      <!-- Centre: Repositories -->
      <div class="gh-panel" style="background:var(--bg-deep);">
        <div style="padding:20px 24px 14px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:baseline;justify-content:space-between">
          <span style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:var(--text-secondary)">Repositories</span>
          <a href="https://github.com/${USERNAME}" target="_blank" rel="noopener noreferrer"
             style="font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-dim);text-decoration:none;transition:color 0.2s"
             onmouseover="this.style.color='var(--text-accent)'" onmouseout="this.style.color='var(--text-dim)'">
            View on GitHub ↗
          </a>
        </div>
        <div class="gh-repos-list" id="gh-repos-list">
          <div class="loading-state" style="margin:24px"><div class="loading-row"></div><div class="loading-row"></div><div class="loading-row"></div></div>
        </div>
      </div>

      <!-- Right: Stats & Languages -->
      <div class="gh-panel" style="background:var(--bg-panel);">
        <div class="gh-activity" id="gh-activity">
          <div class="loading-state"><div class="loading-row"></div><div class="loading-row"></div></div>
        </div>
      </div>
    </div>
  `

  let timer: ReturnType<typeof setInterval>

  const load = async () => {
    const profileEl = document.getElementById('gh-profile-inner')!
    const reposEl   = document.getElementById('gh-repos-list')!
    const actEl     = document.getElementById('gh-activity')!

    try {
      const [user, repos, events] = await Promise.all([
        ghFetch<GitHubUser>(`/users/${USERNAME}`),
        ghFetch<GitHubRepo[]>(`/users/${USERNAME}/repos?sort=updated&per_page=30`),
        ghFetch<GitHubActivity[]>(`/users/${USERNAME}/events/public?per_page=10`).catch(() => [] as GitHubActivity[]),
      ])

      // ── Profile ──────────────────────────────────────────────────────────────
      const memberSince = new Date(user.created_at).getFullYear()
      profileEl.innerHTML = `
        <div class="gh-avatar-wrap">
          <img class="gh-avatar" src="${escHtml(user.avatar_url)}" width="64" height="64" alt="${escHtml(user.login)}" loading="lazy" />
        </div>
        <div>
          <div style="font-size:20px;font-weight:700;letter-spacing:0.06em;color:var(--text-primary)">${escHtml(user.name ?? user.login)}</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.16em;color:var(--text-dim);margin-top:2px">@${escHtml(user.login)}</div>
        </div>
        ${user.bio ? `<div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${escHtml(user.bio)}</div>` : ''}
        <div class="section-divider">
          <div class="section-divider-line"></div>
          <div class="section-divider-label">Identity</div>
          <div class="section-divider-line"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${user.location ? `
            <div class="stat-row">
              <span class="data-label">Location</span>
              <span style="font-size:12px;color:var(--text-secondary)">${escHtml(user.location)}</span>
            </div>
          ` : ''}
          <div class="stat-row">
            <span class="data-label">Member since</span>
            <span class="data-value">${memberSince}</span>
          </div>
          <div class="stat-row">
            <span class="data-label">Followers</span>
            <span class="data-value accent">${formatNum(user.followers)}</span>
          </div>
          <div class="stat-row">
            <span class="data-label">Following</span>
            <span class="data-value">${user.following}</span>
          </div>
          <div class="stat-row">
            <span class="data-label">Public repos</span>
            <span class="data-value accent">${user.public_repos}</span>
          </div>
        </div>
        ${user.blog ? `
          <a href="${escHtml(user.blog)}" target="_blank" rel="noopener noreferrer"
             style="font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.14em;color:var(--text-dim);text-decoration:none;word-break:break-all;transition:color 0.2s"
             onmouseover="this.style.color='var(--text-accent)'" onmouseout="this.style.color='var(--text-dim)'">
            ${escHtml(user.blog)} ↗
          </a>
        ` : ''}
      `

      // ── Repos list ────────────────────────────────────────────────────────────
      const ownRepos = repos.filter(r => !r.fork && !r.archived).slice(0, 20)
      reposEl.innerHTML = ownRepos.map(r => `
        <a class="gh-repo-item" href="${escHtml(r.html_url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">
          <div class="gh-repo-name">${escHtml(r.name)}</div>
          ${r.description ? `<div class="gh-repo-desc">${escHtml(r.description)}</div>` : ''}
          <div class="gh-repo-stats">
            ${r.language ? `
              <span class="gh-repo-stat">
                <span class="lang-dot" style="background:${langColour(r.language)}"></span>
                ${escHtml(r.language)}
              </span>
            ` : ''}
            <span class="gh-repo-stat">★ ${r.stargazers_count}</span>
            <span class="gh-repo-stat">⑂ ${r.forks_count}</span>
            <span class="gh-repo-stat">${relativeTime(r.pushed_at)}</span>
          </div>
          ${r.topics.length ? `
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px">
              ${r.topics.slice(0, 4).map(t => `<span class="tag-pill">${escHtml(t)}</span>`).join('')}
            </div>
          ` : ''}
        </a>
      `).join('')

      // ── Stats & Languages ─────────────────────────────────────────────────────
      const langs = computeLanguages(repos)
      const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
      const totalForks = repos.reduce((s, r) => s + r.forks_count, 0)

      // Recent activity
      const recentActivity = events.slice(0, 5).map(e => {
        const label = eventTypeLabel(e.type)
        return `
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
            <span style="font-size:11px;color:var(--text-secondary)">${label} <span style="color:var(--text-dim)">${escHtml(e.repo.name)}</span></span>
            <span class="data-label">${relativeTime(e.created_at)}</span>
          </div>
        `
      }).join('')

      actEl.innerHTML = `
        <div class="data-label" style="letter-spacing:0.22em">Telemetry</div>
        <div class="gh-stats-grid">
          <div class="gh-stat-tile">
            <span class="gh-stat-n">${formatNum(totalStars)}</span>
            <span class="data-label">Total stars</span>
          </div>
          <div class="gh-stat-tile">
            <span class="gh-stat-n">${user.public_repos}</span>
            <span class="data-label">Repos</span>
          </div>
          <div class="gh-stat-tile">
            <span class="gh-stat-n">${formatNum(totalForks)}</span>
            <span class="data-label">Forks</span>
          </div>
          <div class="gh-stat-tile">
            <span class="gh-stat-n">${ownRepos.length}</span>
            <span class="data-label">Original</span>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-divider-line"></div>
          <div class="section-divider-label">Languages</div>
          <div class="section-divider-line"></div>
        </div>

        ${langs.length ? `
          <div class="gh-lang-bar" style="margin-bottom:10px">
            ${langs.map(l => `<div class="gh-lang-segment" style="flex:${l.pct};background:${langColour(l.lang)}" title="${l.lang} ${l.pct}%"></div>`).join('')}
          </div>
          <div class="gh-lang-legend">
            ${langs.map(l => `
              <div class="gh-lang-row">
                <span class="gh-lang-name">
                  <span class="lang-dot" style="background:${langColour(l.lang)}"></span>
                  ${escHtml(l.lang)}
                </span>
                <span class="gh-lang-pct">${l.pct}%</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${recentActivity ? `
          <div class="section-divider" style="margin-top:8px">
            <div class="section-divider-line"></div>
            <div class="section-divider-label">Recent Activity</div>
            <div class="section-divider-line"></div>
          </div>
          <div>${recentActivity}</div>
        ` : ''}
      `
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      profileEl.innerHTML = `<div class="error-state">${escHtml(msg.slice(0, 160))}</div>`
    }
  }

  await load()
  timer = setInterval(load, 5 * 60 * 1000)

  return () => clearInterval(timer)
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'PushEvent':            return 'Pushed to'
    case 'CreateEvent':          return 'Created'
    case 'DeleteEvent':          return 'Deleted in'
    case 'ForkEvent':            return 'Forked'
    case 'IssuesEvent':          return 'Issue on'
    case 'PullRequestEvent':     return 'PR on'
    case 'WatchEvent':           return 'Starred'
    case 'ReleaseEvent':         return 'Released on'
    case 'IssueCommentEvent':    return 'Commented on'
    case 'CommitCommentEvent':   return 'Commit comment on'
    default:                     return type.replace('Event', '') + ' on'
  }
}

function computeLanguages(repos: GitHubRepo[]): { lang: string; count: number; pct: number }[] {
  const counts: Record<string, number> = {}
  for (const r of repos) {
    if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => ({ lang, count, pct: Math.round((count / total) * 100) }))
}
