import { ghFetchStarred, relativeTime } from '../lib/api'
import type { GitHubRepo } from '../types'

const USERNAME = 'SC4RT'

const LANG_COLOURS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', 'C++': '#f34b7d', C: '#555555',
  HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051', Java: '#b07219',
  Kotlin: '#A97BFF', Swift: '#F05138', Ruby: '#701516', PHP: '#4F5D95',
  'C#': '#178600', Dart: '#00B4AB', Lua: '#000080', Vue: '#41b883',
  Svelte: '#ff3e00', Nix: '#7e7eff', Haskell: '#5e5086',
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

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Card preview ─────────────────────────────────────────────────────────────

export async function renderStarredPreview(container: HTMLElement): Promise<void> {
  container.innerHTML = '<div class="loading-state"><div class="loading-row"></div><div class="loading-row"></div></div>'
  try {
    const raw = await ghFetchStarred(USERNAME)
    const repos = raw as GitHubRepo[]
    const langs: Record<string, number> = {}
    for (const r of repos) {
      if (r.language) langs[r.language] = (langs[r.language] ?? 0) + 1
    }
    const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 4)

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:baseline;gap:12px">
          <span style="font-size:30px;font-weight:700;color:var(--text-primary);line-height:1">${repos.length}</span>
          <span class="data-label">starred repositories</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${topLangs.map(([l]) => `
            <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text-secondary)">
              <span style="width:6px;height:6px;border-radius:50%;background:${langColour(l)};display:inline-block"></span>
              ${escHtml(l)}
            </span>
          `).join('')}
        </div>
      </div>
    `
  } catch {
    container.innerHTML = '<div class="error-state">Starred fetch failed</div>'
  }
}

// ─── Full module ─────────────────────────────────────────────────────────────

type SortKey = 'stars' | 'updated' | 'forks' | 'name'

export async function mountStarred(shell: HTMLElement): Promise<() => void> {
  shell.innerHTML = `
    <div id="starred-content">
      <div class="starred-header-row">
        <div>
          <div class="starred-count" id="starred-count">—</div>
          <div class="starred-count-label">Starred Repositories</div>
        </div>
        <div class="starred-filters">
          <span class="data-label" style="margin-right:4px">Sort:</span>
          <button class="filter-btn active" data-sort="stars">Stars</button>
          <button class="filter-btn" data-sort="updated">Updated</button>
          <button class="filter-btn" data-sort="forks">Forks</button>
          <button class="filter-btn" data-sort="name">Name</button>
        </div>
      </div>
      <div id="starred-lang-filter" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
        <span class="data-label" style="margin-right:4px">Language:</span>
        <button class="filter-btn active" data-lang="all">All</button>
      </div>
      <div class="starred-grid" id="starred-grid">
        <div class="loading-state" style="padding:20px 0">
          <div class="loading-row"></div>
          <div class="loading-row"></div>
          <div class="loading-row"></div>
        </div>
      </div>
    </div>
  `

  let allRepos: GitHubRepo[] = []
  let sortKey: SortKey = 'stars'
  let langFilter = 'all'

  const countEl   = document.getElementById('starred-count')!
  const gridEl    = document.getElementById('starred-grid')!
  const langBar   = document.getElementById('starred-lang-filter')!

  // Bind sort buttons
  shell.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      shell.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      sortKey = btn.dataset.sort as SortKey
      renderGrid()
    })
  })

  function buildLangFilter(repos: GitHubRepo[]) {
    const langs: Record<string, number> = {}
    for (const r of repos) {
      if (r.language) langs[r.language] = (langs[r.language] ?? 0) + 1
    }
    const sorted = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // Keep existing 'All' button and add lang buttons
    const existing = langBar.querySelectorAll('[data-lang]:not([data-lang="all"])')
    existing.forEach(el => el.remove())

    for (const [lang, count] of sorted) {
      const btn = document.createElement('button')
      btn.className = 'filter-btn'
      btn.dataset.lang = lang
      btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:5px;height:5px;border-radius:50%;background:${langColour(lang)};display:inline-block"></span>${escHtml(lang)} <span style="opacity:0.5">${count}</span></span>`
      btn.addEventListener('click', () => {
        langBar.querySelectorAll('[data-lang]').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        langFilter = lang
        renderGrid()
      })
      langBar.appendChild(btn)
    }

    langBar.querySelector<HTMLButtonElement>('[data-lang="all"]')!.addEventListener('click', () => {
      langBar.querySelectorAll('[data-lang]').forEach(b => b.classList.remove('active'))
      langBar.querySelector('[data-lang="all"]')!.classList.add('active')
      langFilter = 'all'
      renderGrid()
    })
  }

  function sortedFiltered(): GitHubRepo[] {
    let repos = allRepos
    if (langFilter !== 'all') repos = repos.filter(r => r.language === langFilter)
    return repos.slice().sort((a, b) => {
      switch (sortKey) {
        case 'stars':   return b.stargazers_count - a.stargazers_count
        case 'forks':   return b.forks_count - a.forks_count
        case 'name':    return a.name.localeCompare(b.name)
        case 'updated': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        default:        return 0
      }
    })
  }

  function renderGrid() {
    const repos = sortedFiltered()
    if (!repos.length) {
      gridEl.innerHTML = '<div class="error-state" style="padding:20px 0">No repositories match this filter</div>'
      return
    }

    gridEl.innerHTML = repos.map((r, i) => `
      <a class="starred-repo animate-fade-up" href="${escHtml(r.html_url)}" target="_blank" rel="noopener noreferrer"
         style="text-decoration:none;animation-delay:${Math.min(i * 0.02, 0.5)}s">
        <div class="starred-repo-main">
          <div>
            <div class="starred-repo-name">${escHtml(r.name)}</div>
            <div class="starred-repo-full">${escHtml(r.full_name)}</div>
          </div>
          ${r.description ? `<div class="starred-repo-desc">${escHtml(r.description)}</div>` : ''}
          <div class="starred-repo-meta">
            ${r.language ? `
              <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary)">
                <span style="width:6px;height:6px;border-radius:50%;background:${langColour(r.language)};display:inline-block;flex-shrink:0"></span>
                ${escHtml(r.language)}
              </span>
            ` : ''}
            <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim)">⑂ ${r.forks_count}</span>
            <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim)">${relativeTime(r.updated_at)}</span>
            ${r.topics.slice(0, 2).map(t => `<span class="tag-pill">${escHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div class="starred-repo-side">
          <div class="starred-star-count">★ ${formatStars(r.stargazers_count)}</div>
          <div class="starred-updated">${new Date(r.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </a>
    `).join('')
  }

  try {
    const raw = await ghFetchStarred(USERNAME)
    allRepos = raw as GitHubRepo[]
    countEl.textContent = String(allRepos.length)
    buildLangFilter(allRepos)
    renderGrid()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    gridEl.innerHTML = `<div class="error-state">Could not fetch starred repos — ${escHtml(msg.slice(0, 120))}</div>`
  }

  return () => {}
}
