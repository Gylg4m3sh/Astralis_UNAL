import { useRef, useEffect } from 'react'
import type { OrbitalBody } from '../../types'

interface Props {
  bodies: OrbitalBody[]
  width?: number
  height?: number
}

// Convierte AU a píxeles
const AU_TO_PX = 120
const CENTER_OFFSET = 0 // el Sol está en [0,0,0]

const OrbitalCanvas = ({ bodies, width = 800, height = 800 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const anglesRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || bodies.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Inicializa ángulos por cuerpo
    bodies.forEach(b => {
      if (!(b.id in anglesRef.current)) anglesRef.current[b.id] = Math.random() * Math.PI * 2
    })

    const cx = width / 2
    const cy = height / 2

    // Velocidad angular simple basada en distancia (ley de Kepler aproximada)
    const getOrbitalRadius = (body: OrbitalBody) =>
      Math.sqrt(body.position[0] ** 2 + body.position[1] ** 2)

    const getAngularSpeed = (body: OrbitalBody) => {
      const r = getOrbitalRadius(body)
      return r === 0 ? 0 : 0.002 / Math.sqrt(r) // más rápido cerca del sol
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Fondo estrellado
      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, width, height)

      // Estrellas de fondo (estáticas)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      for (let i = 0; i < 80; i++) {
        const sx = (i * 137.5) % width
        const sy = (i * 97.3) % height
        ctx.beginPath()
        ctx.arc(sx, sy, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }

      bodies.forEach(body => {
        const r = getOrbitalRadius(body)
        if (r === 0) {
          // Es el Sol
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18)
          gradient.addColorStop(0, '#fff7aa')
          gradient.addColorStop(0.4, body.color)
          gradient.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(cx, cy, 18, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
          return
        }

        // Actualiza ángulo
        anglesRef.current[body.id] += getAngularSpeed(body)
        const angle = anglesRef.current[body.id]
        const px = r * AU_TO_PX

        // Órbita (elipse simplificada como círculo)
        ctx.beginPath()
        ctx.arc(cx, cy, px, 0, Math.PI * 2)
        ctx.strokeStyle = `${body.color}22`
        ctx.lineWidth = 1
        ctx.stroke()

        // Posición del planeta
        const x = cx + Math.cos(angle) * px
        const y = cy + Math.sin(angle) * px
        const radius = Math.max(4, Math.log(body.radius / 1000) * 2)

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5)
        glow.addColorStop(0, body.color)
        glow.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Planeta
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = body.color
        ctx.fill()

        // Nombre
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '11px monospace'
        ctx.fillText(body.name, x + radius + 4, y + 4)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [bodies, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: '12px', display: 'block' }}
    />
  )
}

export default OrbitalCanvas
