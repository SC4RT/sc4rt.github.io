# Zac Chambers — Personal Intelligence System

A production-ready, static personal intelligence interface. Marathon-inspired sci-fi aesthetic with four live data modules.

## Modules

| # | Module | Data Source | Refresh |
|---|--------|-------------|---------|
| 01 | **World Signals** | Polymarket Gamma API (public) | 90 seconds |
| 02 | **GitHub Intelligence** | GitHub REST API v3 | 5 minutes |
| 03 | **Starred Repositories** | GitHub REST API v3 | 15 minutes |
| 04 | **Live Markets** | TradingView widget embed | Live |

---

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Deployment to GitHub Pages

### Automatic (Recommended)

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys automatically on every push to `main`.

**First-time setup:**

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select **GitHub Actions**.
4. Push to `main` — the workflow will build and deploy.

**For project pages** (e.g. `username.github.io/zac-intelligence`):

Edit the workflow environment variable:
```yaml
VITE_BASE_PATH: '/zac-intelligence/'
```

**For root/user pages** (`username.github.io`):

Keep as:
```yaml
VITE_BASE_PATH: '/'
```

---

### Manual Build

```bash
npm run build
# Output is in ./dist — deploy this directory.
```

---

## GitHub API Rate Limits

Unauthenticated: **60 requests/hour** per IP.

To raise this to 5,000/hr, store a public read-only PAT in browser `localStorage`:

```javascript
localStorage.setItem('gh_token', 'github_pat_your_token_here')
```

Generate a PAT at `github.com/settings/tokens` with **no scopes** (read-only public data requires no permissions).

This token is stored locally in the browser only and never leaves the client.

---

## Architecture Notes

| Decision | Rationale |
|----------|-----------|
| Vite + TypeScript | Static output, zero server required, type-safe |
| GitHub REST API v3 | Stable, CORS-enabled, well-documented |
| Polymarket Gamma API | Public, browser-accessible, CORS-enabled |
| TradingView widget | Official embed, no API key required for standard charts |
| In-memory cache | Avoids redundant API calls without any server |
| GitHub Actions Pages deploy | Official GitHub-recommended workflow pattern |

No server. No backend. No secrets in the repo. Fully static.

---

## British English

All UI copy, labels, and comments use British English spelling and conventions.
