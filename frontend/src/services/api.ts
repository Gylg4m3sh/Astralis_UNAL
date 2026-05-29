import axios from "axios";
import type {
  Exoplanet,
  ISSPosition,
  OrbitalBody,
  PaginatedResponse,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- MOCKS temporales (reemplazar cuando E1 esté listo) ---
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const mockExoplanets: Exoplanet[] = [
  {
    id: "1",
    name: "Kepler-452b",
    hostStar: "Kepler-452",
    orbitalPeriod: 384.8,
    planetRadius: 1.6,
    equilibriumTemp: 265,
    classification: "CONFIRMED",
    mlConfidence: 0.97,
    discoveryYear: 2015,
  },
  {
    id: "2",
    name: "Kepler-22b",
    hostStar: "Kepler-22",
    orbitalPeriod: 289.9,
    planetRadius: 2.4,
    equilibriumTemp: 295,
    classification: "CONFIRMED",
    mlConfidence: 0.91,
    discoveryYear: 2011,
  },
];

// --- Servicios ---
export const exoplanetService = {
  getAll: async (
    page = 1,
    filter?: string,
    pageSize = 50,
  ): Promise<PaginatedResponse<Exoplanet>> => {
    if (USE_MOCKS) {
      const filtered = filter
        ? mockExoplanets.filter((e) => e.classification === filter)
        : mockExoplanets;
      return { data: filtered, total: filtered.length, page, pageSize: 10 };
    }
    const { data } = await apiClient.get("/api/exoplanets", {
      params: { page, filter, pageSize },
    });
    return data;
  },

  getById: async (id: string): Promise<Exoplanet> => {
    if (USE_MOCKS) return mockExoplanets.find((e) => e.id === id)!;
    const { data } = await apiClient.get(`/api/exoplanets/${id}`);
    return data;
  },
};

export const issService = {
  getPosition: async (): Promise<ISSPosition> => {
    if (USE_MOCKS) {
      return {
        latitude: 4.7,
        longitude: -74.0,
        altitude: 408,
        velocity: 27600,
        timestamp: Date.now(),
      };
    }
    const { data } = await apiClient.get("/api/iss/position");
    return data;
  },
};

export const orbitalService = {
  getBodies: async (): Promise<OrbitalBody[]> => {
    if (USE_MOCKS) {
      return [
        {
          id: "sun",
          name: "Sol",
          mass: 1.989e30,
          radius: 696340,
          position: [0, 0, 0],
          velocity: [0, 0, 0],
          color: "#FDB813",
        },
        {
          id: "earth",
          name: "Tierra",
          mass: 5.972e24,
          radius: 6371,
          position: [1, 0, 0],
          velocity: [0, 29.78, 0],
          color: "#4B9CD3",
        },
        {
          id: "mars",
          name: "Marte",
          mass: 6.39e23,
          radius: 3389,
          position: [1.52, 0, 0],
          velocity: [0, 24.07, 0],
          color: "#C1440E",
        },
      ];
    }
    const { data } = await apiClient.get("/api/simulation/bodies");
    return data;
  },
};
