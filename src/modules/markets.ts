// Markets module — embeds TradingView's advanced chart widget.
// TradingView's library is loaded as a script tag in index.html.
// See: https://www.tradingview.com/widget/advanced-chart/

// Declare global TradingView type to avoid TypeScript errors
declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => {
        onChartReady?: (cb: () => void) => void
      }
    }
  }
}

const WATCHLIST = [
  { sym: 'NASDAQ:NVDA', name: 'NVIDIA', label: 'AI / Compute' },
  { sym: 'NASDAQ:AAPL', name: 'Apple', label: 'Consumer Tech' },
  { sym: 'NASDAQ:MSFT', name: 'Microsoft', label: 'Enterprise' },
  { sym: 'NASDAQ:TSLA', name: 'Tesla', label: 'EV / Energy' },
  { sym: 'BINANCE:BTCUSDT', name: 'Bitcoin', label: 'Crypto' },
  { sym: 'BINANCE:ETHUSDT', name: 'Ethereum', label: 'Crypto' },
  { sym: 'FOREXCOM:SPXUSD', name: 'S&P 500', label: 'Index' },
  { sym: 'TVC:GOLD', name: 'Gold', label: 'Commodity' },
  { sym: 'TVC:USOIL', name: 'WTI Crude', label: 'Commodity' },
]

let activeSymbol = WATCHLIST[0].sym
let tvWidget: unknown = null

function escHtml(str: string): string {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function mountTvChart(containerId: string, symbol: string): void {
  const container = document.getElementById(containerId)
  if (!container) return

  // Clear previous chart
  container.innerHTML = ''

  if (!window.TradingView) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px">
        <div class="data-label" style="text-align:center">Loading TradingView…</div>
        <div style="font-size:11px;color:var(--text-dim);text-align:center">
          If this persists, ensure the TradingView script has loaded.
        </div>
      </div>
    `
    // Retry after a short delay if TV hasn't loaded yet
    setTimeout(() => mountTvChart(containerId, symbol), 1500)
    return
  }

  const chartDiv = document.createElement('div')
  chartDiv.id = 'tv_widget_inner'
  chartDiv.style.width = '100%'
  chartDiv.style.height = '100%'
  container.appendChild(chartDiv)

  tvWidget = new window.TradingView.widget({
    container: 'tv_widget_inner',
    autosize: true,
    symbol: symbol,
    interval: 'D',
    timezone: 'Europe/London',
    theme: 'dark',
    style: '1',
    locale: 'en',

    // Styling aligned with our design system
    toolbar_bg: '#08090c',
    backgroundColor: 'rgba(8,9,12,1)',
    gridColor: 'rgba(140,175,215,0.05)',

    // Features
    withdateranges: true,
    allow_symbol_change: true,
    save_image: false,
    hide_legend: false,
    studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],

    // Minimal UI
    hide_top_toolbar: false,
    hide_side_toolbar: false,

    // Watchlist embedded in chart (TV feature)
    watchlist: WATCHLIST.map(w => w.sym),

    overrides: {
      'paneProperties.background': '#08090c',
      'paneProperties.backgroundGradientStartColor': '#08090c',
      'paneProperties.backgroundGradientEndColor': '#08090c',
      'paneProperties.vertGridProperties.color': 'rgba(140,175,215,0.04)',
      'paneProperties.horzGridProperties.color': 'rgba(140,175,215,0.04)',
      'scalesProperties.textColor': '#8897a8',
      'scalesProperties.fontSize': 11,
      'mainSeriesProperties.candleStyle.upColor': '#3a7855',
      'mainSeriesProperties.candleStyle.downColor': '#905050',
      'mainSeriesProperties.candleStyle.borderUpColor': '#3a7855',
      'mainSeriesProperties.candleStyle.borderDownColor': '#905050',
      'mainSeriesProperties.candleStyle.wickUpColor': '#3a7855',
      'mainSeriesProperties.candleStyle.wickDownColor': '#905050',
    },
  })
}

// ─── Card preview ─────────────────────────────────────────────────────────────

export function renderMarketsPreview(container: HTMLElement): void {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;flex-direction:column;gap:6px">
        ${WATCHLIST.slice(0, 4).map(w => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-subtle)">
            <div>
              <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${escHtml(w.name)}</span>
              <span class="data-label" style="margin-left:8px">${escHtml(w.label)}</span>
            </div>
            <span class="data-label">${escHtml(w.sym.split(':')[1] ?? w.sym)}</span>
          </div>
        `).join('')}
      </div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.16em;color:var(--text-dim)">
        TradingView · Live data
      </div>
    </div>
  `
}

// ─── Full module ─────────────────────────────────────────────────────────────

export function mountMarkets(shell: HTMLElement): () => void {
  shell.innerHTML = `
    <div id="markets-content">
      <!-- Chart panel -->
      <div class="markets-chart-panel">
        <div class="markets-info-bar">
          <span>TradingView Advanced Chart</span>
          <span>·</span>
          <span id="markets-active-sym" style="color:var(--text-accent)">${escHtml(activeSymbol)}</span>
          <span>·</span>
          <span>London timezone</span>
          <span>·</span>
          <div class="card-live-dot"></div>
          <span>Live</span>
        </div>
        <div class="tv-chart-wrap" id="tv_chart_container"></div>
      </div>

      <!-- Watchlist sidebar -->
      <aside class="markets-sidebar">
        <div class="market-watchlist-header">Watchlist</div>
        ${WATCHLIST.map((w, i) => `
          <div class="market-ticker ${i === 0 ? 'active' : ''}" data-sym="${escHtml(w.sym)}">
            <div>
              <div class="market-ticker-sym">${escHtml(w.sym.split(':')[1] ?? w.sym)}</div>
              <div class="market-ticker-name">${escHtml(w.name)} · ${escHtml(w.label)}</div>
            </div>
          </div>
        `).join('')}

        <!-- Info block at bottom -->
        <div style="margin-top:auto;padding:16px 20px;border-top:1px solid var(--border-subtle)">
          <div class="data-label" style="margin-bottom:8px">Data Source</div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.6">
            Live market data via TradingView. Chart interactions are fully live.
          </div>
          <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.14em;color:var(--text-dim);text-decoration:none;transition:color 0.2s"
             onmouseover="this.style.color='var(--text-accent)'" onmouseout="this.style.color='var(--text-dim)'">
            TradingView ↗
          </a>
        </div>
      </aside>
    </div>
  `

  // Bind watchlist ticker clicks
  shell.querySelectorAll<HTMLElement>('.market-ticker').forEach(ticker => {
    ticker.addEventListener('click', () => {
      const sym = ticker.dataset.sym
      if (!sym || sym === activeSymbol) return
      activeSymbol = sym

      shell.querySelectorAll('.market-ticker').forEach(t => t.classList.remove('active'))
      ticker.classList.add('active')

      const activeSymEl = document.getElementById('markets-active-sym')
      if (activeSymEl) activeSymEl.textContent = sym

      mountTvChart('tv_chart_container', sym)
    })
  })

  // Mount initial chart
  mountTvChart('tv_chart_container', activeSymbol)

  return () => {
    // Nothing to clean up — TradingView manages its own lifecycle
  }
}
