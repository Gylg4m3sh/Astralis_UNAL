import { useNavigate } from 'react-router-dom'
import type { Exoplanet } from '../../types'

const classificationColor: Record<Exoplanet['classification'], string> = {
  CONFIRMED: 'var(--color-confirmed)',
  CANDIDATE: 'var(--color-candidate)',
  FALSE_POSITIVE: 'var(--color-false-positive)',
}

const classificationLabel: Record<Exoplanet['classification'], string> = {
  CONFIRMED: 'Confirmado',
  CANDIDATE: 'Candidato',
  FALSE_POSITIVE: 'Falso positivo',
}

interface Props { exoplanet: Exoplanet }

const ExoplanetCard = ({ exoplanet }: Props) => {
  const navigate = useNavigate()
  const color = classificationColor[exoplanet.classification]

  return (
    <button
      onClick={() => navigate(`/exoplanets/${exoplanet.id}`)}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${color}33`
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      style={{
        textAlign: 'left', width: '100%', cursor: 'pointer',
        background: 'var(--color-surface)', border: `1px solid ${color}33`,
        borderRadius: '12px', padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem',
          fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.05em' }}>
          {exoplanet.name}
        </h3>
        <span style={{
          background: `${color}18`, color, border: `1px solid ${color}`,
          borderRadius: '4px', padding: '2px 8px',
          fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
        }}>
          {classificationLabel[exoplanet.classification]}
        </span>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
        ★ {exoplanet.hostStar}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {[
          { label: 'Período', value: `${exoplanet.orbitalPeriod}d` },
          { label: 'Radio', value: `${exoplanet.planetRadius} R⊕` },
          { label: 'Temp.', value: `${exoplanet.equilibriumTemp} K` },
          { label: 'ML', value: `${(exoplanet.mlConfidence * 100).toFixed(0)}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.62rem',
              color: 'var(--color-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-text)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </button>
  )
}

export default ExoplanetCard
