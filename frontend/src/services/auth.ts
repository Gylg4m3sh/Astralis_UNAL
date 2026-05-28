import { apiClient } from './api'
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

const mockUser = {
  id: '1',
  username: 'astro_user',
  email: 'demo@unal.edu.co',
  token: 'mock-jwt-token-xyz',
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 800)) // simula latencia
      if (credentials.email === 'demo@unal.edu.co' && credentials.password === 'demo1234') {
        localStorage.setItem('token', mockUser.token)
        localStorage.setItem('user', JSON.stringify(mockUser))
        return { user: mockUser, token: mockUser.token }
      }
      throw new Error('Credenciales inválidas')
    }
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', credentials)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    if (USE_MOCKS) {
      await new Promise(r => setTimeout(r, 1000))
      const user = { id: '2', username: credentials.username, email: credentials.email, token: 'mock-jwt-new' }
      localStorage.setItem('token', user.token)
      localStorage.setItem('user', JSON.stringify(user))
      return { user, token: user.token }
    }
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', credentials)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getCurrentUser: () => {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
}
