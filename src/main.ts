import './style.css'
import { AmbientBackground } from './background'
import {
  renderWorldSignalsPreview,
  mountWorldSignals,
} from './modules/worldSignals'
import {
  renderGithubPreview,
  mountGithub,
} from './modules/github'
import {
  renderStarredPreview,
  mountStarred,
} from './modules/starredRepos'
import {
  renderMarketsPreview,
  mountMarkets,
} from './modules/markets'
import type { ModuleId } from './types'

// ─── App root ─────────────────────────────────────────────────────────────────

const app = document.getElementById('app')!

// Canvas background
const canvas = document.createElement('canvas')
canvas.id = 'bg-canvas'
app.appendChild(canvas)

const bg = new AmbientBackground(canvas)
bg.start()

// Scene wrapper
const scene = document.createElement('div')
scene.id = 'scene'
app.appendChild(scene)

// ─── Live clock ───────────────────────────────────────────────────────────────

function formatClock(): string {
  const now = new Date()
  return now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/London',
  })
}

function formatDate(): string {
  const now = new Date()
  return now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  }).toUpperCase()
}

// ─── Home layout HTML ─────────────────────────────────────────────────────────

function buildHome(): string {
  return `
    <div id="home">
      <!-- Header -->
      <header id="home-header">
        <div class="header-identity">
          <div class="header-name">Zac Chambers</div>
          <div class="header-sub">Personal Intelligence System · v1.0</div>
        </div>
        <div class="header-status">
          <div class="status-item">
            <span class="status-label">Date</span>
            <span class="status-value" id="live-date">${formatDate()}</span>
          </div>
          <div class="status-item">
            <span class="status-label">GMT</span>
            <span class="status-value" id="live-clock">${formatClock()}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Status</span>
            <div class="status-pip-row">
              <div class="status-pip"></div>
              <span class="status-value" style="font-size:11px">Online</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Row 1 -->
      <div class="module-row">
        <div class="module-card" data-module="world-signals" data-cut="tr">
          <div class="card-header">
            <span class="card-num">01</span>
            <span class="card-title">World Signals</span>
            <div class="card-live"><div class="card-live-dot"></div>Live</div>
          </div>
          <div class="card-body" id="preview-world-signals">
            <div class="loading-state">
              <div class="loading-row"></div>
              <div class="loading-row"></div>
              <div class="loading-row"></div>
            </div>
          </div>
          <div class="card-footer">
            <span class="data-label">Polymarket prediction markets</span>
            <span class="card-enter">
              Enter
              <span class="card-enter-arrow">→</span>
            </span>
          </div>
        </div>

        <div class="module-card" data-module="github" data-cut="bl">
          <div class="card-header">
            <span class="card-num">02</span>
            <span class="card-title">GitHub Intelligence</span>
            <div class="card-live"><div class="card-live-dot"></div>SC4RT</div>
          </div>
          <div class="card-body" id="preview-github">
            <div class="loading-state">
              <div class="loading-row"></div>
              <div class="loading-row"></div>
              <div class="loading-row"></div>
            </div>
          </div>
          <div class="card-footer">
            <span class="data-label">Engineering telemetry</span>
            <span class="card-enter">
              Enter
              <span class="card-enter-arrow">→</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Row 2 -->
      <div class="module-row">
        <div class="module-card" data-module="starred" data-cut="tl">
          <div class="card-header">
            <span class="card-num">03</span>
            <span class="card-title">Starred Repos</span>
            <div class="card-live"><div class="card-live-dot"></div>Curated</div>
          </div>
          <div class="card-body" id="preview-starred">
            <div class="loading-state">
              <div class="loading-row"></div>
              <div class="loading-row"></div>
            </div>
          </div>
          <div class="card-footer">
            <span class="data-label">Repository intelligence</span>
            <span class="card-enter">
              Enter
              <span class="card-enter-arrow">→</span>
            </span>
          </div>
        </div>

        <div class="module-card" data-module="markets" data-cut="br">
          <div class="card-header">
            <span class="card-num">04</span>
            <span class="card-title">Live Markets</span>
            <div class="card-live"><div class="card-live-dot"></div>Live</div>
          </div>
          <div class="card-body" id="preview-markets">
          </div>
          <div class="card-footer">
            <span class="data-label">TradingView terminal</span>
            <span class="card-enter">
              Enter
              <span class="card-enter-arrow">→</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Module shell overlay -->
    <div id="module-shell">
      <div class="shell-header">
        <button class="shell-back" id="shell-back" aria-label="Return to home">
          <span class="shell-back-arrow">←</span>
          Return
        </button>
        <div class="shell-title-group">
          <span class="shell-module-id" id="shell-module-id"></span>
          <span class="shell-module-name" id="shell-module-name"></span>
        </div>
      </div>
      <div class="shell-content" id="shell-content"></div>
    </div>
  `
}

// ─── Router ───────────────────────────────────────────────────────────────────

let currentModule: ModuleId = 'home'
let cleanup: (() => void) | null = null

const MODULE_META: Record<Exclude<ModuleId, 'home'>, { id: string; name: string }> = {
  'world-signals': { id: '01 / WORLD', name: 'World Signals' },
  'github':        { id: '02 / INTEL', name: 'GitHub Intelligence' },
  'starred':       { id: '03 / REPOS', name: 'Starred Repositories' },
  'markets':       { id: '04 / MRKTS', name: 'Live Markets' },
}

async function navigate(to: ModuleId): Promise<void> {
  if (to === currentModule) return
  currentModule = to

  const homeEl   = document.getElementById('home')!
  const shellEl  = document.getElementById('module-shell')!
  const contentEl = document.getElementById('shell-content')!
  const idEl     = document.getElementById('shell-module-id')!
  const nameEl   = document.getElementById('shell-module-name')!

  if (to === 'home') {
    // Collapse shell, show home
    shellEl.classList.remove('active')
    homeEl.classList.remove('exiting')
    if (cleanup) {
      cleanup()
      cleanup = null
    }
    return
  }

  // Show shell
  const meta = MODULE_META[to]
  idEl.textContent   = meta.id
  nameEl.textContent = meta.name

  homeEl.classList.add('exiting')
  contentEl.innerHTML = ''

  shellEl.classList.add('active')

  // Mount the correct module
  switch (to) {
    case 'world-signals':
      cleanup = await mountWorldSignals(contentEl)
      break
    case 'github':
      cleanup = await mountGithub(contentEl)
      break
    case 'starred':
      cleanup = await mountStarred(contentEl)
      break
    case 'markets':
      cleanup = mountMarkets(contentEl)
      break
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

scene.innerHTML = buildHome()

// Wire module card clicks
scene.querySelectorAll<HTMLElement>('[data-module]').forEach(card => {
  card.addEventListener('click', () => {
    const mod = card.dataset.module as ModuleId
    navigate(mod)
  })
})

// Wire back button
document.getElementById('shell-back')!.addEventListener('click', () => {
  navigate('home')
})

// Keyboard: Escape returns home
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && currentModule !== 'home') {
    navigate('home')
  }
})

// Clock tick
setInterval(() => {
  const clockEl = document.getElementById('live-clock')
  const dateEl  = document.getElementById('live-date')
  if (clockEl) clockEl.textContent = formatClock()
  if (dateEl)  dateEl.textContent  = formatDate()
}, 1000)

// Load card previews asynchronously so home renders instantly
const marketsPrev = document.getElementById('preview-markets')
if (marketsPrev) renderMarketsPreview(marketsPrev)

renderWorldSignalsPreview(document.getElementById('preview-world-signals')!)
renderGithubPreview(document.getElementById('preview-github')!)
renderStarredPreview(document.getElementById('preview-starred')!)
