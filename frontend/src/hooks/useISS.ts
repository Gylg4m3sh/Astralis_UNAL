import { useState, useEffect, useRef } from 'react'
import { fetchISSPosition } from '../services/iss'
import type { ISSPosition } from '../types'

interface UseISSReturn {
  position: ISSPosition | null
  history: [number, number][]   // trail de posiciones [lat, lng]
  loading: boolean
  error: string | null
}

const MAX_TRAIL = 40

export const useISS = (intervalMs = 5000): UseISSReturn => {
  const [position, setPosition] = useState<ISSPosition | null>(null)
  const [history, setHistory] = useState<[number, number][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = async () => {
    try {
      const pos = await fetchISSPosition()
      setPosition(pos)
      setHistory(prev => {
        const next = [...prev, [pos.latitude, pos.longitude] as [number, number]]
        return next.slice(-MAX_TRAIL)
      })
      setError(null)
    } catch {
      setError('No se pudo obtener la posición de la ISS')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    intervalRef.current = setInterval(fetch, intervalMs)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [intervalMs])

  return { position, history, loading, error }
}
