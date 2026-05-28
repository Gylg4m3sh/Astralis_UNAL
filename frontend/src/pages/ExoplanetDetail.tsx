import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { exoplanetService } from "../services/api";
import { fetchLightCurve } from "../services/lightCurve";
import LightCurveChart from "../components/exoplanets/LightCurveChart";
import type { Exoplanet } from "../types";
import type { LightCurvePoint } from "../services/lightCurve";

const classificationColor: Record<Exoplanet["classification"], string> = {
  CONFIRMED: "var(--color-confirmed)",
  CANDIDATE: "var(--color-candidate)",
  FALSE_POSITIVE: "var(--color-false-positive)",
};

const classificationLabel: Record<Exoplanet["classification"], string> = {
  CONFIRMED: "Confirmado",
  CANDIDATE: "Candidato",
  FALSE_POSITIVE: "Falso positivo",
};

const ExoplanetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [planet, setPlanet] = useState<Exoplanet | null>(null);
  const [curve, setCurve] = useState<LightCurvePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    exoplanetService
      .getById(id)
      .then(async (p) => {
        setPlanet(p);
        const curve = await fetchLightCurve(p.id);
        setCurve(curve);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          padding: "2rem",
          background: "var(--color-void)",
          minHeight: "100vh",
        }}
      >
        <p
          style={{
            color: "var(--color-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Cargando...
        </p>
      </div>
    );

  if (!planet)
    return (
      <div
        style={{
          padding: "2rem",
          background: "var(--color-void)",
          minHeight: "100vh",
        }}
      >
        <p
          style={{
            color: "var(--color-false-positive)",
            fontFamily: "var(--font-body)",
          }}
        >
          Exoplaneta no encontrado.
        </p>
      </div>
    );

  const color = classificationColor[planet.classification];

  return (
    <div
      style={{
        padding: "2rem",
        background: "var(--color-void)",
        minHeight: "100vh",
        color: "var(--color-text)",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/exoplanets")}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          letterSpacing: "0.1em",
          color: "var(--color-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--color-text)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--color-muted)")
        }
      >
        ← Volver al catálogo
      </button>

      {/* Header */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "0.1em",
              marginBottom: "0.25rem",
            }}
          >
            {planet.name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--color-muted)",
            }}
          >
            Estrella anfitriona: {planet.hostStar}
          </p>
        </div>
        <span
          style={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}`,
            borderRadius: "6px",
            padding: "6px 16px",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
          }}
        >
          {classificationLabel[planet.classification]}
        </span>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: "Período orbital",
            value: `${planet.orbitalPeriod}`,
            unit: "días",
          },
          {
            label: "Radio planetario",
            value: `${planet.planetRadius}`,
            unit: "R⊕",
          },
          {
            label: "Temp. equilibrio",
            value: `${planet.equilibriumTemp}`,
            unit: "K",
          },
          {
            label: "Confianza ML",
            value: `${(planet.mlConfidence * 100).toFixed(0)}`,
            unit: "%",
          },
          { label: "Descubierto", value: `${planet.discoveryYear}`, unit: "" },
        ].map(({ label, value, unit }) => (
          <div
            key={label}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
                marginBottom: "0.4rem",
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "var(--color-accent)",
              }}
            >
              {value}
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-muted)",
                  marginLeft: "4px",
                }}
              >
                {unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Curva de luz */}
      <LightCurveChart data={curve} planetName={planet.name} />
    </div>
  );
};

export default ExoplanetDetail;
