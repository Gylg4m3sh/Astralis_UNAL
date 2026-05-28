import { useState, useEffect } from 'react'
import { orbitalService } from '../services/api'
import type { OrbitalBody } from '../types'

interface UseOrbitalBodiesReturn {
  bodies: OrbitalBody[]
  loading: boolean
  error: string | null
}

export const useOrbitalBodies = (): UseOrbitalBodiesReturn => {
  const [bodies, setBodies] = useState<OrbitalBody[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    orbitalService.getBodies()
      .then(setBodies)
      .catch(() => setError('Error cargando cuerpos orbitales'))
      .finally(() => setLoading(false))
  }, [])

  return { bodies, loading, error }
}
