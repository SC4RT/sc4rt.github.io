// Ambient background — a slow-drifting precision grid with geometric accent lines.
// Designed to feel like a living engineering schematic, not a screensaver.

export class AmbientBackground {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private raf: number = 0
  private t = 0

  // Slow drift velocity in px/s
  private readonly driftVX = 4
  private readonly driftVY = 2.5

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', this.resize)
  }

  private resize = (): void => {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  start(): void {
    let last = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      this.t += dt
      this.draw()
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop(): void {
    cancelAnimationFrame(this.raf)
  }

  private draw(): void {
    const { ctx, canvas, t } = this
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    // ── Layer 1: coarse grid ─────────────────────────────────────────────────
    const spacing = 80
    const ox = (t * this.driftVX) % spacing
    const oy = (t * this.driftVY) % spacing

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(140,175,215,0.035)'
    ctx.lineWidth = 0.5
    for (let x = -ox; x < W + spacing; x += spacing) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
    }
    for (let y = -oy; y < H + spacing; y += spacing) {
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()

    // ── Layer 2: fine sub-grid ────────────────────────────────────────────────
    const sub = spacing / 4
    const sox = (t * this.driftVX) % sub
    const soy = (t * this.driftVY) % sub

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(140,175,215,0.012)'
    ctx.lineWidth = 0.5
    for (let x = -sox; x < W + sub; x += sub) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
    }
    for (let y = -soy; y < H + sub; y += sub) {
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()

    // ── Layer 3: slow-moving diagonal accent line ─────────────────────────────
    const angle = Math.PI / 6          // 30°
    const period = 40                  // seconds per full cycle
    const phase = (t % period) / period
    const startX = -W * 0.5 + phase * W * 2.5

    ctx.beginPath()
    ctx.strokeStyle = 'rgba(140,175,215,0.06)'
    ctx.lineWidth = 1
    ctx.moveTo(startX, 0)
    ctx.lineTo(startX + H / Math.tan(angle), H)
    ctx.stroke()

    // Second accent line, offset
    const startX2 = startX + W * 0.9
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(140,175,215,0.03)'
    ctx.lineWidth = 0.5
    ctx.moveTo(startX2, 0)
    ctx.lineTo(startX2 + H / Math.tan(angle), H)
    ctx.stroke()

    // ── Layer 4: corner anchor dots ───────────────────────────────────────────
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.8)
    const dotAlpha = 0.08 + 0.04 * pulse
    ctx.fillStyle = `rgba(140,175,215,${dotAlpha})`
    const dotPositions = [
      [0, 0], [W, 0], [0, H], [W, H],
      [W / 2, 0], [W / 2, H], [0, H / 2], [W, H / 2],
    ]
    for (const [x, y] of dotPositions) {
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    // ── Layer 5: scanning horizontal bar (very subtle) ────────────────────────
    const scanY = (t * 60) % (H + 20) - 10
    const scanGrad = ctx.createLinearGradient(0, scanY - 8, 0, scanY + 8)
    scanGrad.addColorStop(0, 'rgba(140,175,215,0)')
    scanGrad.addColorStop(0.5, 'rgba(140,175,215,0.018)')
    scanGrad.addColorStop(1, 'rgba(140,175,215,0)')
    ctx.fillStyle = scanGrad
    ctx.fillRect(0, scanY - 8, W, 16)
  }

  destroy(): void {
    this.stop()
    window.removeEventListener('resize', this.resize)
  }
}
