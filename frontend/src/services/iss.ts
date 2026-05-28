import type { ISSPosition } from '../types'

interface OpenNotifyResponse {
  iss_position: { latitude: string; longitude: string }
  timestamp: number
  message: string
}

export const fetchISSPosition = async (): Promise<ISSPosition> => {
  const res = await fetch('/iss-api/iss-now.json')
  if (!res.ok) throw new Error('Error consultando ISS')
  const json: OpenNotifyResponse = await res.json()
  return {
    latitude: parseFloat(json.iss_position.latitude),
    longitude: parseFloat(json.iss_position.longitude),
    altitude: 408,   // promedio estable, Horizons no lo expone gratis
    velocity: 27600, // km/h promedio real
    timestamp: json.timestamp * 1000,
  }
}
