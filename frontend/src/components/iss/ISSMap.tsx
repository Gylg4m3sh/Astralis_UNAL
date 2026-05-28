import { useRef, useEffect } from 'react'
import type { ISSPosition } from '../../types'

interface Props {
  position: ISSPosition | null
  history: [number, number][]
}

// Proyección equirectangular: lat/lng → px
const project = (lat: number, lng: number, w: number, h: number) => ({
  x: ((lng + 180) / 360) * w,
  y: ((90 - lat) / 180) * h,
})

const ISSMap = ({ position, history }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)

    // Fondo
    ctx.fillStyle = '#07071a'
    ctx.fillRect(0, 0, W, H)

    // Grid de meridianos y paralelos
    ctx.strokeStyle = 'rgba(99,102,241,0.08)'
    ctx.lineWidth = 0.5
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * W
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * H
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Ecuador y meridiano central destacados
    ctx.strokeStyle = 'rgba(99,102,241,0.2)'
    ctx.lineWidth = 1
    const eqY = H / 2
    ctx.beginPath(); ctx.moveTo(0, eqY); ctx.lineTo(W, eqY); ctx.stroke()
    const merX = W / 2
    ctx.beginPath(); ctx.moveTo(merX, 0); ctx.lineTo(merX, H); ctx.stroke()

    // Trail
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const prev = project(history[i-1][0], history[i-1][1], W, H)
        const curr = project(history[i][0], history[i][1], W, H)
        const alpha = i / history.length
        // No dibujar si cruza el antimeridiano
        if (Math.abs(history[i][1] - history[i-1][1]) > 180) continue
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(curr.x, curr.y)
        ctx.strokeStyle = `rgba(99,102,241,${alpha * 0.7})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    // ISS
    if (position) {
      const { x, y } = project(position.latitude, position.longitude, W, H)

      // Glow rings
      ;[40, 25, 14].forEach((r, i) => {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(99,102,241,${0.08 + i * 0.06})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Punto ISS
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 8)
      grad.addColorStop(0, '#fff')
      grad.addColorStop(0.4, '#a5b4fc')
      grad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Label
      ctx.fillStyle = 'rgba(165,180,252,0.9)'
      ctx.font = '11px monospace'
      ctx.fillText('ISS', x + 12, y - 8)
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.font = '10px monospace'
      ctx.fillText(`${position.latitude.toFixed(2)}° ${position.longitude.toFixed(2)}°`, x + 12, y + 6)
    }

  }, [position, history])

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={450}
      style={{ borderRadius: '12px', display: 'block', width: '100%', height: 'auto' }}
    />
  )
}

export default ISSMap
