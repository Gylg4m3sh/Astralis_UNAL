import type { Exoplanet } from "../types";
import { apiClient } from "./api";

export interface LightCurvePoint {
  time: number; // horas relativas al centro del tránsito
  flux: number; // flujo normalizado (1.0 = sin tránsito)
  fluxNoise: number; // con ruido realista
}

// Modelo de tránsito simplificado (Mandel & Agol aproximado)
const transitDepth = (planetRadius: number) => {
  // Profundidad ∝ (Rp/Rs)^2, asumimos Rs = 1 solar
  const ratio = planetRadius * 0.009167; // radios terrestres a radios solares
  return Math.min(ratio * ratio, 0.05);
};

const transitShape = (t: number, duration: number, depth: number): number => {
  const halfD = duration / 2;
  const ingress = duration * 0.15; // duración del ingreso/egreso

  if (Math.abs(t) > halfD) return 1.0;

  if (Math.abs(t) > halfD - ingress) {
    // Ingreso o egreso (limb darkening simplificado)
    const phase = (halfD - Math.abs(t)) / ingress;
    return 1.0 - depth * Math.sin((phase * Math.PI) / 2) ** 2;
  }

  // Fondo plano del tránsito
  return 1.0 - depth;
};

export const generateLightCurve = (exoplanet: Exoplanet): LightCurvePoint[] => {
  const depth = transitDepth(exoplanet.planetRadius);
  const duration = Math.min(exoplanet.orbitalPeriod * 0.01, 8); // horas, ~1% del período
  const noiseLevel = 0.0008 + Math.random() * 0.0004;

  const points: LightCurvePoint[] = [];
  const totalTime = duration * 4; // ventana de observación
  const steps = 200;

  for (let i = 0; i <= steps; i++) {
    const t = -totalTime / 2 + (i / steps) * totalTime;
    const flux = transitShape(t, duration, depth);
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;

    points.push({
      time: parseFloat(t.toFixed(3)),
      flux: parseFloat(flux.toFixed(6)),
      fluxNoise: parseFloat((flux + noise).toFixed(6)),
    });
  }

  return points;
};

export const fetchLightCurve = async (
  exoplanetId: string,
): Promise<LightCurvePoint[]> => {
  const { data } = await apiClient.get(
    `/api/exoplanets/${exoplanetId}/lightcurve`,
  );
  return data;
};
