import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { ISSPosition } from '../../types'

// SVG de la ISS como icono
const issSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
  <!-- Cuerpo central -->
  <rect x="26" y="28" width="12" height="8" rx="2" fill="#a5b4fc" stroke="#6366f1" stroke-width="1.5"/>
  <!-- Módulo central -->
  <rect x="29" y="24" width="6" height="16" rx="1.5" fill="#c7d2fe" stroke="#6366f1" stroke-width="1"/>
  <!-- Paneles solares izquierda -->
  <rect x="4" y="26" width="18" height="5" rx="1" fill="#1e3a5f" stroke="#6366f1" stroke-width="1"/>
  <rect x="4" y="33" width="18" height="5" rx="1" fill="#1e3a5f" stroke="#6366f1" stroke-width="1"/>
  <!-- Paneles solares derecha -->
  <rect x="42" y="26" width="18" height="5" rx="1" fill="#1e3a5f" stroke="#6366f1" stroke-width="1"/>
  <rect x="42" y="33" width="18" height="5" rx="1" fill="#1e3a5f" stroke="#6366f1" stroke-width="1"/>
  <!-- Conectores paneles -->
  <rect x="22" y="29.5" width="5" height="1.5" fill="#6366f1"/>
  <rect x="22" y="33" width="5" height="1.5" fill="#6366f1"/>
  <rect x="37" y="29.5" width="5" height="1.5" fill="#6366f1"/>
  <rect x="37" y="33" width="5" height="1.5" fill="#6366f1"/>
  <!-- Panel superior -->
  <rect x="29" y="14" width="6" height="10" rx="1" fill="#1e3a5f" stroke="#6366f1" stroke-width="1"/>
  <!-- Panel inferior -->
  <rect x="29" y="40" width="6" height="10" rx="1" fill="#1e3a5f" stroke="#6366f1" stroke-width="1"/>
  <!-- Glow central -->
  <circle cx="32" cy="32" r="5" fill="rgba(99,102,241,0.3)"/>
</svg>`

const issIcon = L.divIcon({
  html: `<div style="filter: drop-shadow(0 0 8px rgba(99,102,241,0.9)) drop-shadow(0 0 16px rgba(99,102,241,0.5));">
    ${issSVG}
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  className: '',
})

/**
 * Splits a flat array of [lat, lng] points into multiple segments,
 * breaking whenever the ISS crosses the antimeridian (longitude diff > 180°).
 * This prevents Leaflet from drawing a line all the way across the map.
 */
function splitTrailAtAntimeridian(history: [number, number][]): [number, number][][] {
  if (history.length < 2) return history.length === 1 ? [history] : []

  const segments: [number, number][][] = []
  let current: [number, number][] = [history[0]]

  for (let i = 1; i < history.length; i++) {
    const [, prevLng] = history[i - 1]
    const [lat, lng] = history[i]
    // If longitude jumps more than 180°, it crossed the antimeridian — start a new segment
    if (Math.abs(lng - prevLng) > 180) {
      if (current.length >= 2) segments.push(current)
      current = [[lat, lng]]
    } else {
      current.push([lat, lng])
    }
  }
  if (current.length >= 2) segments.push(current)

  return segments
}

// Componente que centra el mapa en la ISS suavemente
const MapFollower = ({ position }: { position: ISSPosition }) => {
  const map = useMap()
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      map.setView([position.latitude, position.longitude], 3)
      firstRender.current = false
    } else {
      map.panTo([position.latitude, position.longitude], { animate: true, duration: 1 })
    }
  }, [position.latitude, position.longitude])

  return null
}

interface Props {
  position: ISSPosition | null
  history: [number, number][]
}

const ISSMap = ({ position, history }: Props) => {
  if (!position) return null

  const trailSegments = splitTrailAtAntimeridian(history)

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={3}
        style={{ height: '500px', width: '100%', background: '#07071a' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Dark tiles — CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
        />

        {/* Trail de la órbita — split at antimeridian to avoid cross-map lines */}
        {trailSegments.map((segment, idx) => (
          <Polyline
            key={idx}
            positions={segment}
            pathOptions={{
              color: '#6366f1',
              weight: 2,
              opacity: 0.6,
              dashArray: '6 4',
            }}
          />
        ))}

        {/* Marcador ISS */}
        <Marker
          position={[position.latitude, position.longitude]}
          icon={issIcon}
        />

        {/* Seguidor de posición */}
        <MapFollower position={position} />
      </MapContainer>
    </div>
  )
}

export default ISSMap
