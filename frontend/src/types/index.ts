// Exoplaneta del NASA Exoplanet Archive / modelo ML
export interface Exoplanet {
  id: string;
  name: string;
  hostStar: string;
  orbitalPeriod: number; // días
  planetRadius: number; // radios terrestres
  equilibriumTemp: number; // Kelvin
  classification: "CONFIRMED" | "FALSE_POSITIVE" | "CANDIDATE";
  mlConfidence: number; // 0-1, del modelo E3
  discoveryYear: number;
}

// Cuerpo orbital para el simulador (JPL Horizons)
export interface OrbitalBody {
  id: string;
  name: string;
  mass: number; // kg
  radius: number; // km
  position: [number, number, number]; // AU
  velocity: [number, number, number]; // km/s
  color: string;
  texture?: string;
}

// ISS (Open Notify API)
export interface ISSPosition {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/h
  timestamp: number;
}

// Respuesta paginada genérica del backend
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Usuario autenticado
export interface User {
  id: string;
  email: string;
  username: string;
  token: string;
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
