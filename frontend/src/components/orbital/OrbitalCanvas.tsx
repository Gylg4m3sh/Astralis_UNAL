import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

export interface PlanetData {
  id: string
  name: string
  color: string
  glowColor: string
  radius: number
  orbitRadius: number
  speed: number
  angle: number
  rings?: boolean
  distanceAU: number
  orbitalPeriodDays: number
  diameterKm: number
  moons: number
  fact: string
}

export interface OrbitalCanvasHandle {
  setPaused: (v: boolean) => void
  setSpeedMultiplier: (v: number) => void
}

interface Props {
  onPlanetClick: (planet: PlanetData | null) => void
}

const BASE_SPEED = 0.008

const PLANETS: PlanetData[] = [
  {
    id: 'mercury', name: 'Mercurio', color: '#b5b5b5', glowColor: '#d4d4d4',
    radius: 4, orbitRadius: 80, distanceAU: 0.39, orbitalPeriodDays: 88,
    diameterKm: 4879, moons: 0, rings: false,
    speed: BASE_SPEED / Math.pow(0.39, 1.5) * 0.39, angle: Math.random() * Math.PI * 2,
    fact: 'El planeta más pequeño y más cercano al Sol.',
  },
  {
    id: 'venus', name: 'Venus', color: '#e8cda0', glowColor: '#f5deb3',
    radius: 6, orbitRadius: 130, distanceAU: 0.72, orbitalPeriodDays: 225,
    diameterKm: 12104, moons: 0, rings: false,
    speed: BASE_SPEED / Math.pow(0.72, 1.5) * 0.72, angle: Math.random() * Math.PI * 2,
    fact: 'El planeta más caliente del sistema solar (~465°C).',
  },
  {
    id: 'earth', name: 'Tierra', color: '#4B9CD3', glowColor: '#87ceeb',
    radius: 7, orbitRadius: 185, distanceAU: 1.00, orbitalPeriodDays: 365,
    diameterKm: 12742, moons: 1, rings: false,
    speed: BASE_SPEED, angle: Math.random() * Math.PI * 2,
    fact: 'Único planeta conocido con vida.',
  },
  {
    id: 'mars', name: 'Marte', color: '#C1440E', glowColor: '#e8633a',
    radius: 5, orbitRadius: 245, distanceAU: 1.52, orbitalPeriodDays: 687,
    diameterKm: 6779, moons: 2, rings: false,
    speed: BASE_SPEED / Math.pow(1.52, 1.5) * 1.52, angle: Math.random() * Math.PI * 2,
    fact: 'Tiene el volcán más alto del sistema solar: Olympus Mons.',
  },
  {
    id: 'jupiter', name: 'Júpiter', color: '#c88b3a', glowColor: '#e8a855',
    radius: 14, orbitRadius: 320, distanceAU: 5.20, orbitalPeriodDays: 4333,
    diameterKm: 139820, moons: 95, rings: false,
    speed: BASE_SPEED / Math.pow(5.20, 1.5) * 5.20, angle: Math.random() * Math.PI * 2,
    fact: 'El planeta más grande, con la Gran Mancha Roja activa hace 350 años.',
  },
  {
    id: 'saturn', name: 'Saturno', color: '#e8d5a3', glowColor: '#f0e68c',
    radius: 11, orbitRadius: 400, distanceAU: 9.58, orbitalPeriodDays: 10759,
    diameterKm: 116460, moons: 146, rings: true,
    speed: BASE_SPEED / Math.pow(9.58, 1.5) * 9.58, angle: Math.random() * Math.PI * 2,
    fact: 'Sus anillos tienen 270.000 km de diámetro pero solo 1 km de grosor.',
  },
]

const TRAIL_LENGTH = 120
const MIN_ZOOM = 0.3
const MAX_ZOOM = 4

const buildNebula = (W: number, H: number): HTMLCanvasElement => {
  const nc = document.createElement('canvas')
  nc.width = W; nc.height = H
  const nCtx = nc.getContext('2d')!
  nCtx.fillStyle = '#03030f'
  nCtx.fillRect(0, 0, W, H)
  const clouds = [
    { x: W*0.15, y: H*0.25, r: W*0.22, color: 'rgba(99,102,241,0.05)' },
    { x: W*0.85, y: H*0.75, r: W*0.25, color: 'rgba(139,92,246,0.04)' },
    { x: W*0.50, y: H*0.08, r: W*0.18, color: 'rgba(59,130,246,0.04)' },
    { x: W*0.05, y: H*0.85, r: W*0.20, color: 'rgba(99,102,241,0.03)' },
    { x: W*0.92, y: H*0.15, r: W*0.17, color: 'rgba(167,139,250,0.04)' },
  ]
  clouds.forEach(({ x, y, r, color }) => {
    const g = nCtx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color); g.addColorStop(1, 'transparent')
    nCtx.fillStyle = g
    nCtx.beginPath(); nCtx.arc(x, y, r, 0, Math.PI*2); nCtx.fill()
  })
  for (let i = 0; i < 300; i++) {
    const sx = Math.random()*W, sy = Math.random()*H
    const sr = Math.random()*1.2+0.2, op = Math.random()*0.8+0.2
    nCtx.beginPath(); nCtx.arc(sx, sy, sr, 0, Math.PI*2)
    nCtx.fillStyle = `rgba(255,255,255,${op})`; nCtx.fill()
  }
  for (let i = 0; i < 15; i++) {
    const sx = Math.random()*W, sy = Math.random()*H
    const sg = nCtx.createRadialGradient(sx, sy, 0, sx, sy, 3)
    sg.addColorStop(0, 'rgba(255,255,255,0.9)'); sg.addColorStop(1, 'transparent')
    nCtx.fillStyle = sg; nCtx.beginPath(); nCtx.arc(sx, sy, 3, 0, Math.PI*2); nCtx.fill()
  }
  return nc
}

const OrbitalCanvas = forwardRef<OrbitalCanvasHandle, Props>(({ onPlanetClick }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const planetsRef = useRef<PlanetData[]>(PLANETS.map(p => ({ ...p })))
  const trailsRef = useRef<Record<string, [number, number][]>>(
    Object.fromEntries(PLANETS.map(p => [p.id, []]))
  )
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const nebulaRef = useRef<HTMLCanvasElement | null>(null)
  const sizeRef = useRef({ W: 0, H: 0 })
  const pausedRef = useRef(false)
  const speedRef = useRef(1)
  const hoveredRef = useRef<string | null>(null)

  // Zoom y pan
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const panStartRef = useRef({ x: 0, y: 0 })

  useImperativeHandle(ref, () => ({
    setPaused: (v) => { pausedRef.current = v },
    setSpeedMultiplier: (v) => { speedRef.current = v },
  }))

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      const W = container.clientWidth
      const H = container.clientHeight
      canvas.width = W; canvas.height = H
      sizeRef.current = { W, H }
      nebulaRef.current = buildNebula(W, H)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    // ── Zoom con scroll ──
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width)
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height)
      const { W, H } = sizeRef.current
      const cx = W/2 + panRef.current.x
      const cy = H/2 + panRef.current.y

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * zoomFactor))

      // Zoom hacia el cursor
      const scale = newZoom / zoomRef.current
      panRef.current = {
        x: mouseX - (mouseX - cx) * scale - W/2,
        y: mouseY - (mouseY - cy) * scale - H/2,
      }
      zoomRef.current = newZoom
    }

    // ── Drag para pan ──
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      draggingRef.current = true
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      panStartRef.current = { ...panRef.current }
      canvas.style.cursor = 'grabbing'
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width)
      const my = (e.clientY - rect.top) * (canvas.height / rect.height)
      const { W, H } = sizeRef.current
      const cx = W/2 + panRef.current.x
      const cy = H/2 + panRef.current.y

      if (draggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x
        const dy = e.clientY - dragStartRef.current.y
        panRef.current = {
          x: panStartRef.current.x + dx,
          y: panStartRef.current.y + dy,
        }
        return
      }

      // Hover detection en coordenadas transformadas
      let found: string | null = null
      planetsRef.current.forEach(p => {
        const pos = positionsRef.current[p.id]
        if (!pos) return
        const screenX = cx + (pos.x - cx)
        const screenY = cy + (pos.y - cy)
        if (Math.hypot(mx - screenX, my - screenY) < (p.radius * zoomRef.current) * 2 + 6) found = p.id
      })
      hoveredRef.current = found
      canvas.style.cursor = found ? 'pointer' : 'grab'
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const dx = Math.abs(e.clientX - dragStartRef.current.x)
      const dy = Math.abs(e.clientY - dragStartRef.current.y)
      draggingRef.current = false
      canvas.style.cursor = 'grab'

      // Solo dispara click si no hubo drag significativo
      if (dx < 4 && dy < 4) {
        const rect = canvas.getBoundingClientRect()
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width)
        const my = (e.clientY - rect.top) * (canvas.height / rect.height)
        const { W, H } = sizeRef.current
        const cx = W/2 + panRef.current.x
        const cy = H/2 + panRef.current.y
        let clicked: PlanetData | null = null
        planetsRef.current.forEach(p => {
          const pos = positionsRef.current[p.id]
          if (!pos) return
          const screenX = cx + (pos.x - cx)
          const screenY = cy + (pos.y - cy)
          if (Math.hypot(mx - screenX, my - screenY) < (p.radius * zoomRef.current) * 2 + 6) clicked = p
        })
        onPlanetClick(clicked)
      }
    }

    const handleMouseLeave = () => { draggingRef.current = false }

    // Doble click para resetear zoom
    const handleDblClick = () => {
      zoomRef.current = 1
      panRef.current = { x: 0, y: 0 }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('dblclick', handleDblClick)
    canvas.style.cursor = 'grab'

    const drawSun = (cx: number, cy: number, zoom: number) => {
      const r = 18 * zoom
      const corona = ctx.createRadialGradient(cx, cy, r, cx, cy, 60*zoom)
      corona.addColorStop(0, 'rgba(255,180,0,0.15)'); corona.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(cx, cy, 60*zoom, 0, Math.PI*2); ctx.fillStyle = corona; ctx.fill()
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30*zoom)
      glow.addColorStop(0, '#fff7aa'); glow.addColorStop(0.4, '#FDB813')
      glow.addColorStop(0.8, '#ff6600'); glow.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(cx, cy, 30*zoom, 0, Math.PI*2); ctx.fillStyle = glow; ctx.fill()
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      core.addColorStop(0, '#ffffff'); core.addColorStop(0.3, '#fff7aa'); core.addColorStop(1, '#FDB813')
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = core; ctx.fill()
    }

    const drawTrail = (planet: PlanetData, trail: [number, number][], cx: number, cy: number, zoom: number) => {
      if (trail.length < 2) return
      for (let i = 1; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.6
        const [x1, y1] = trail[i-1]; const [x2, y2] = trail[i]
        if (Math.hypot(x2-x1, y2-y1) > planet.orbitRadius) continue
        const sx1 = cx + (x1 - cx), sy1 = cy + (y1 - cy)
        const sx2 = cx + (x2 - cx), sy2 = cy + (y2 - cy)
        ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2)
        ctx.strokeStyle = `${planet.glowColor}${Math.floor(alpha*255).toString(16).padStart(2,'0')}`
        ctx.lineWidth = 1.5; ctx.stroke()
      }
    }

    const drawPlanet = (planet: PlanetData, x: number, y: number, cx: number, cy: number, zoom: number) => {
      const sx = cx + (x - cx)
      const sy = cy + (y - cy)
      const r = planet.radius * zoom
      const angle = Math.atan2(sy - cy, sx - cx)
      const isHovered = hoveredRef.current === planet.id
      const scale = isHovered ? 1.3 : 1

      if (isHovered) {
        ctx.beginPath(); ctx.arc(sx, sy, r*scale+8, 0, Math.PI*2)
        ctx.strokeStyle = `${planet.glowColor}99`; ctx.lineWidth = 1.5
        ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([])
      }

      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r*scale*3)
      glow.addColorStop(0, `${planet.glowColor}${isHovered ? '60' : '40'}`); glow.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(sx, sy, r*scale*3, 0, Math.PI*2); ctx.fillStyle = glow; ctx.fill()

      if (planet.rings) {
        ctx.save(); ctx.translate(sx, sy); ctx.scale(1, 0.3)
        ctx.beginPath(); ctx.arc(0, 0, r*scale*2.4, 0, Math.PI*2)
        ctx.strokeStyle = 'rgba(232,213,163,0.5)'; ctx.lineWidth = 4*zoom; ctx.stroke()
        ctx.beginPath(); ctx.arc(0, 0, r*scale*2.0, 0, Math.PI*2)
        ctx.strokeStyle = 'rgba(232,213,163,0.3)'; ctx.lineWidth = 3*zoom; ctx.stroke()
        ctx.restore()
      }

      const lightX = sx - Math.cos(angle)*r*scale*0.3
      const lightY = sy - Math.sin(angle)*r*scale*0.3
      const body = ctx.createRadialGradient(lightX, lightY, 0, sx, sy, r*scale)
      body.addColorStop(0, planet.glowColor); body.addColorStop(0.5, planet.color)
      body.addColorStop(1, `${planet.color}88`)
      ctx.beginPath(); ctx.arc(sx, sy, r*scale, 0, Math.PI*2); ctx.fillStyle = body; ctx.fill()

      const shadow = ctx.createRadialGradient(
        sx+Math.cos(angle)*r*scale*0.5, sy+Math.sin(angle)*r*scale*0.5,
        0, sx, sy, r*scale
      )
      shadow.addColorStop(0, 'transparent'); shadow.addColorStop(0.6, 'transparent')
      shadow.addColorStop(1, 'rgba(0,0,0,0.6)')
      ctx.beginPath(); ctx.arc(sx, sy, r*scale, 0, Math.PI*2); ctx.fillStyle = shadow; ctx.fill()

      ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)'
      ctx.font = `${Math.max(9, 10*zoom)}px monospace`
      ctx.fillText(planet.name, sx + r*scale + 5, sy + 4)
    }

    const draw = () => {
      const { W, H } = sizeRef.current
      if (!W || !H) { animRef.current = requestAnimationFrame(draw); return }
      const zoom = zoomRef.current
      const cx = W/2 + panRef.current.x
      const cy = H/2 + panRef.current.y

      ctx.clearRect(0, 0, W, H)
      if (nebulaRef.current) ctx.drawImage(nebulaRef.current, 0, 0)

      // Órbitas escaladas
      planetsRef.current.forEach(p => {
        ctx.beginPath(); ctx.arc(cx, cy, p.orbitRadius * zoom, 0, Math.PI*2)
        ctx.strokeStyle = 'rgba(99,102,241,0.12)'; ctx.lineWidth = 1
        ctx.setLineDash([3,6]); ctx.stroke(); ctx.setLineDash([])
      })

      drawSun(cx, cy, zoom)

      planetsRef.current.forEach(planet => {
        if (!pausedRef.current) planet.angle += planet.speed * speedRef.current
        const x = cx + Math.cos(planet.angle) * planet.orbitRadius * zoom
        const y = cy + Math.sin(planet.angle) * planet.orbitRadius * zoom
        positionsRef.current[planet.id] = { x, y }
        const trail = trailsRef.current[planet.id]
        if (!pausedRef.current) { trail.push([x, y]); if (trail.length > TRAIL_LENGTH) trail.shift() }
        drawTrail(planet, trail, cx, cy, zoom)
        drawPlanet(planet, x, y, cx, cy, zoom)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current); ro.disconnect()
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('dblclick', handleDblClick)
    }
  }, [onPlanetClick])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
})

OrbitalCanvas.displayName = 'OrbitalCanvas'
export default OrbitalCanvas
