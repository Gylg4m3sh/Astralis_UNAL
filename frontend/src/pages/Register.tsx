import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password) { setError('Completa todos los campos'); return }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true); setError(null)
    try {
      await register(form)
      navigate('/')
    } catch (e: any) {
      setError(e.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
    background: 'var(--color-deep)', border: '1px solid var(--color-border)',
    color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
    outline: 'none', transition: 'border-color 0.2s',
  }

  const fields = [
    { key: 'username', label: 'Nombre de usuario', type: 'text', placeholder: 'astro_user' },
    { key: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'correo@unal.edu.co' },
    { key: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••' },
    { key: 'confirmPassword', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-void)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '500px', height: '500px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '20px', padding: '2.5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900,
            letterSpacing: '0.3em', color: 'var(--color-accent)',
            textShadow: '0 0 20px rgba(99,102,241,0.6)', marginBottom: '0.5rem' }}>
            ASTRALIS
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
            letterSpacing: '0.15em', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            CREAR CUENTA
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            Observatorio Astronómico Nacional · UNAL
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem',
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)',
                display: 'block', marginBottom: '6px' }}>
                {label}
              </label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={set(key)}
                placeholder={placeholder}
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem',
            color: 'var(--color-false-positive)', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            background: loading ? 'var(--color-border)' : 'var(--color-accent)',
            color: '#fff', border: 'none',
            boxShadow: loading ? 'none' : '0 0 20px rgba(99,102,241,0.4)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem',
          color: 'var(--color-muted)', textAlign: 'center', marginTop: '1.5rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
