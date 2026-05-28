import { useOrbitalBodies } from '../hooks/useOrbitalBodies'
import OrbitalCanvas from '../components/orbital/OrbitalCanvas'

const OrbitalSimulator = () => {
  const { bodies, loading, error } = useOrbitalBodies()

  return (
    <div style={{ padding: '2rem', background: '#050510', minHeight: '100vh', color: '#e2e8f0' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Simulador Orbital</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Sistema solar — datos JPL Horizons
      </p>

      {loading && <p style={{ color: '#64748b' }}>Cargando simulación...</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <OrbitalCanvas bodies={bodies} width={750} height={750} />
        </div>
      )}
    </div>
  )
}

export default OrbitalSimulator
