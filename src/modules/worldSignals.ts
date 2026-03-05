import { polyFetch, formatVolume, pct, relativeTime } from '../lib/api'
import type { PolymarketEvent, PolymarketMarket } from '../types'

// Language colours used for category tags
const CATEGORY_COLOURS: Record<string, string> = {
  politics:   '#4e8ab0',
  elections:  '#4e8ab0',
  crypto:     '#b07840',
  finance:    '#b07840',
  sports:     '#3a7855',
  science:    '#7855b0',
  tech:       '#7855b0',
  world:      '#a04040',
}

function tagColour(label: string): string {
  const key = label.toLowerCase()
  for (const [k, v] of Object.entries(CATEGORY_COLOURS)) {
    if (key.includes(k)) return v
  }
  return '#606080'
}

function parseOutcomePrices(raw: string): number[] {
  try {
    const arr = JSON.parse(raw)
    return arr.map((v: string | number) => parseFloat(String(v)))
  } catch {
    return [0.5, 0.5]
  }
}

function parseOutcomes(raw: string): string[] {
  try {
    return JSON.parse(raw)
  } catch {
    return ['Yes', 'No']
  }
}

// Render a single binary market probability bar
function renderMarketBar(market: PolymarketMarket): string {
  const prices = parseOutcomePrices(market.outcomePrices)
  const outcomes = parseOutcomes(market.outcomes)
  const yes = prices[0] ?? 0.5
  const pctClass = yes >= 0.65 ? 'high' : yes <= 0.35 ? 'low' : ''

  return `
    <div class="prob-bar-wrap">
      <div class="prob-bar-meta">
        <span class="prob-label">${escHtml(market.question)}</span>
        <span class="prob-value">${pct(yes)}</span>
      </div>
      <div class="prob-bar-track">
        <div class="prob-bar-fill ${pctClass}" style="width:${(yes * 100).toFixed(1)}%"></div>
      </div>
      <div class="prob-bar-meta" style="margin-top:2px">
        <span class="data-label">${escHtml(outcomes[0] ?? 'Yes')}</span>
        <span class="data-label">${formatVolume(market.volume)} vol</span>
      </div>
    </div>
  `
}

function renderEvent(event: PolymarketEvent): string {
  const markets = event.markets
    .filter(m => !m.closed)
    .slice(0, 3)

  const tags = (event.tags ?? []).slice(0, 3)

  return `
    <article class="ws-event animate-fade-up" style="animation-delay:${Math.random() * 0.2}s">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <div class="ws-event-title">${escHtml(event.title)}</div>
        ${tags.length ? `<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;">
          ${tags.map(t => `<span class="tag-pill" style="color:${tagColour(t.label)};border-color:${tagColour(t.label)}44">${escHtml(t.label)}</span>`).join('')}
        </div>` : ''}
      </div>

      <div class="ws-event-meta">
        <div class="ws-meta-item">
          <span class="data-label">Volume</span>
          <span class="data-value accent">${formatVolume(event.volume)}</span>
        </div>
        <div class="ws-meta-item">
          <span class="data-label">Liquidity</span>
          <span class="data-value">${formatVolume(event.liquidity)}</span>
        </div>
        <div class="ws-meta-item">
          <span class="data-label">Closes</span>
          <span class="data-value">${formatEndDate(event.endDate)}</span>
        </div>
        <div class="ws-meta-item">
          <span class="data-label">Markets</span>
          <span class="data-value">${event.markets.length}</span>
        </div>
      </div>

      ${markets.length ? `
        <div class="ws-event-markets">
          ${markets.map(renderMarketBar).join('')}
        </div>
      ` : ''}
    </article>
  `
}

function formatEndDate(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Card preview (home screen) ───────────────────────────────────────────────

export async function renderWorldSignalsPreview(container: HTMLElement): Promise<void> {
  container.innerHTML = '<div class="loading-state"><div class="loading-row"></div><div class="loading-row"></div><div class="loading-row"></div></div>'

  try {
    const events = await polyFetch<PolymarketEvent[]>('/events', {
      active: true,
      closed: false,
      limit: 2,
      order: 'volume',
      ascending: false,
    })

    if (!events.length) {
      container.innerHTML = '<div class="error-state">No active markets</div>'
      return
    }

    const event = events[0]
    const market = event.markets.find(m => !m.closed)

    if (!market) {
      container.innerHTML = `<div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${escHtml(event.title)}</div>`
      return
    }

    const prices = parseOutcomePrices(market.outcomePrices)
    const yes = prices[0] ?? 0.5
    const pctClass = yes >= 0.65 ? 'high' : yes <= 0.35 ? 'low' : ''

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:11px;color:var(--text-secondary);line-height:1.4">${escHtml(event.title.slice(0, 80))}${event.title.length > 80 ? '…' : ''}</div>
        <div class="prob-bar-wrap">
          <div class="prob-bar-meta">
            <span class="prob-label" style="font-size:10px">${escHtml(market.question.slice(0, 50))}${market.question.length > 50 ? '…' : ''}</span>
            <span class="prob-value">${pct(yes)}</span>
          </div>
          <div class="prob-bar-track">
            <div class="prob-bar-fill ${pctClass}" style="width:${(yes * 100).toFixed(1)}%"></div>
          </div>
        </div>
        <div style="display:flex;gap:16px">
          <div class="ws-meta-item">
            <span class="data-label">Vol</span>
            <span class="data-value accent" style="font-size:11px">${formatVolume(event.volume)}</span>
          </div>
          <div class="ws-meta-item">
            <span class="data-label">Markets</span>
            <span class="data-value" style="font-size:11px">${events.length} active</span>
          </div>
        </div>
      </div>
    `
  } catch {
    container.innerHTML = '<div class="error-state">Signal fetch failed</div>'
  }
}

// ─── Full module ─────────────────────────────────────────────────────────────

export async function mountWorldSignals(shell: HTMLElement): Promise<() => void> {
  shell.innerHTML = `
    <div id="ws-content">
      <div class="ws-main" id="ws-main">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px">
          <div>
            <div style="font-size:22px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">World Signals</div>
            <div class="data-label" style="margin-top:4px">Live Polymarket prediction markets — sorted by volume</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="card-live-dot"></div>
            <span class="data-label">Auto-refresh 90s</span>
          </div>
        </div>
        <div id="ws-events">
          <div class="loading-state">
            <div class="loading-row"></div>
            <div class="loading-row"></div>
            <div class="loading-row"></div>
          </div>
        </div>
      </div>
      <aside class="ws-sidebar" id="ws-sidebar">
        <div class="data-label" style="letter-spacing:0.22em;margin-bottom:4px">Top Markets by Prob</div>
        <div id="ws-top-markets">
          <div class="loading-state">
            <div class="loading-row"></div>
            <div class="loading-row"></div>
          </div>
        </div>
        <div class="section-divider" style="margin-top:8px">
          <div class="section-divider-line"></div>
          <div class="section-divider-label">Platform</div>
          <div class="section-divider-line"></div>
        </div>
        <div id="ws-platform-stats" style="display:flex;flex-direction:column;gap:10px">
          <div class="loading-state"><div class="loading-row"></div></div>
        </div>
      </aside>
    </div>
  `

  let timer: ReturnType<typeof setInterval>

  const load = async () => {
    const eventsEl = document.getElementById('ws-events')!
    const topEl    = document.getElementById('ws-top-markets')!
    const statsEl  = document.getElementById('ws-platform-stats')!

    try {
      const [events, topMarkets] = await Promise.all([
        polyFetch<PolymarketEvent[]>('/events', {
          active: true, closed: false, limit: 8, order: 'volume', ascending: false,
        }),
        polyFetch<PolymarketMarket[]>('/markets', {
          active: true, closed: false, limit: 6, order: 'volume', ascending: false,
        }),
      ])

      // Render events
      if (events.length) {
        eventsEl.innerHTML = events.map(renderEvent).join('')
      } else {
        eventsEl.innerHTML = '<div class="error-state">No active events found</div>'
      }

      // Render top markets sidebar
      if (topMarkets.length) {
        topEl.innerHTML = topMarkets.slice(0, 5).map(m => {
          const prices = parseOutcomePrices(m.outcomePrices)
          const yes = prices[0] ?? 0.5
          const cls = yes >= 0.65 ? 'high' : yes <= 0.35 ? 'low' : ''
          return `
            <div class="prob-bar-wrap" style="padding-bottom:10px;border-bottom:1px solid var(--border-subtle);margin-bottom:10px">
              <div class="prob-bar-meta">
                <span class="prob-label" style="font-size:10px">${escHtml(m.question.slice(0, 55))}${m.question.length > 55 ? '…' : ''}</span>
                <span class="prob-value">${pct(yes)}</span>
              </div>
              <div class="prob-bar-track" style="margin-top:4px">
                <div class="prob-bar-fill ${cls}" style="width:${(yes * 100).toFixed(1)}%"></div>
              </div>
              <div class="prob-bar-meta" style="margin-top:3px">
                <span class="data-label">${formatVolume(m.volume)}</span>
              </div>
            </div>
          `
        }).join('')

        // Platform summary
        const totalVol = events.reduce((sum, e) => sum + parseFloat(e.volume || '0'), 0)
        const totalMkts = events.reduce((sum, e) => sum + e.markets.length, 0)
        statsEl.innerHTML = `
          <div class="stat-row">
            <span class="data-label">Active events shown</span>
            <span class="data-value accent">${events.length}</span>
          </div>
          <div class="stat-row">
            <span class="data-label">Total markets</span>
            <span class="data-value">${totalMkts}</span>
          </div>
          <div class="stat-row">
            <span class="data-label">Combined volume</span>
            <span class="data-value accent">${formatVolume(totalVol)}</span>
          </div>
          <div class="stat-row">
            <span class="data-label">Source</span>
            <span class="data-value" style="font-size:10px">Polymarket Gamma API</span>
          </div>
        `
      } else {
        topEl.innerHTML = '<div class="error-state">No market data</div>'
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      eventsEl.innerHTML = `<div class="error-state">Cannot reach Polymarket API — ${escHtml(msg.slice(0, 120))}</div>`
    }
  }

  await load()
  timer = setInterval(load, 90_000)

  return () => clearInterval(timer)
}
