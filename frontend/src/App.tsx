import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import OrbitalSimulator from './pages/OrbitalSimulator'
import ExoplanetCatalog from './pages/ExoplanetCatalog'
import ExoplanetDetail from './pages/ExoplanetDetail'
import ISSTracker from './pages/ISSTracker'
import Login from './pages/Login'
import Register from './pages/Register'

const NavBar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'relative', zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 2rem',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-deep)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>


        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '1.1rem', letterSpacing: '0.3em', color: 'var(--color-accent)',
          textShadow: '0 0 20px rgba(99,102,241,0.6)', cursor: 'pointer',
        }} onClick={() => navigate('/')}>
          ASTRALIS
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[
            { to: '/', label: 'Inicio' },
            { to: '/simulator', label: 'Simulador' },
            { to: '/exoplanets', label: 'Exoplanetas' },
            { to: '/iss', label: 'ISS' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                textDecoration: 'none', transition: 'color 0.2s',
              })}>
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Auth section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated ? (
          <>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem',
              color: 'var(--color-muted)' }}>
              {user?.username}
            </span>
            <button
              onClick={() => { logout(); navigate('/') }}
              style={{
                fontFamily: 'var(--font-body)', fontSize: '0.72rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--color-muted)', background: 'none',
                border: '1px solid var(--color-border)', borderRadius: '6px',
                padding: '4px 12px', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-false-positive)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              Salir
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/login')}
              style={{
                fontFamily: 'var(--font-body)', fontSize: '0.72rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--color-muted)', background: 'none', border: 'none',
                cursor: 'pointer', transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
            >
              Ingresar
            </button>
            <button onClick={() => navigate('/register')}
              style={{
                fontFamily: 'var(--font-body)', fontSize: '0.72rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#fff', background: 'var(--color-accent)',
                border: '1px solid var(--color-accent)', borderRadius: '6px',
                padding: '4px 14px', cursor: 'pointer', transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Registrarse
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <NavBar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<OrbitalSimulator />} />
          <Route path="/exoplanets" element={<ExoplanetCatalog />} />
          <Route path="/exoplanets/:id" element={<ExoplanetDetail />} />
          <Route path="/iss" element={<ISSTracker />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </AuthProvider>
  </BrowserRouter>
)

export default App
