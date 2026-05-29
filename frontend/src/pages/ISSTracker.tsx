import { useISS } from "../hooks/useISS";
import ISSMap from "../components/iss/ISSMap";

const StatCard = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) => (
  <div
    style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "12px",
      padding: "1.25rem 1.5rem",
      flex: "1",
      minWidth: "140px",
    }}
  >
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.65rem",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--color-muted)",
        marginBottom: "0.5rem",
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "var(--color-accent)",
      }}
    >
      {value}
      {unit && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-muted)",
            marginLeft: "4px",
          }}
        >
          {unit}
        </span>
      )}
    </p>
  </div>
);

const ISSTracker = () => {
  const { position, history, loading, error } = useISS(5000);

  const timestamp = position
    ? new Date(position.timestamp).toUTCString().replace("GMT", "UTC")
    : "—";

  return (
    <div
      style={{
        padding: "2rem",
        background: "var(--color-void)",
        minHeight: "100vh",
        color: "var(--color-text)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            ISS TRACKER
          </h1>
          {/* Indicador live */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "999px",
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.3)",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
                animation: "pulse-glow 1.5s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.65rem",
                color: "#4ade80",
                letterSpacing: "0.1em",
              }}
            >
              LIVE
            </span>
          </div>
        </div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            color: "var(--color-muted)",
          }}
        >
          Posición en tiempo real · Open Notify ISS API
        </p>
      </div>

      {loading && (
        <p
          style={{
            color: "var(--color-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Conectando con la ISS...
        </p>
      )}
      {error && (
        <p
          style={{
            color: "var(--color-false-positive)",
            fontFamily: "var(--font-body)",
          }}
        >
          {error}
        </p>
      )}

      {!loading && !error && position && (
        <>
          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
            }}
          >
            <StatCard
              label="Latitud"
              value={position.latitude.toFixed(4)}
              unit="°"
            />
            <StatCard
              label="Longitud"
              value={position.longitude.toFixed(4)}
              unit="°"
            />
            <StatCard
              label="Altitud"
              value={position.altitude.toString()}
              unit="km"
            />
            <StatCard
              label="Velocidad"
              value={position.velocity.toLocaleString()}
              unit="km/h"
            />
          </div>

          {/* Mapa */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <ISSMap position={position} history={history} />
          </div>

          {/* Timestamp */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              color: "var(--color-muted)",
              textAlign: "right",
            }}
          >
            Última actualización: {timestamp}
          </p>
        </>
      )}
    </div>
  );
};

export default ISSTracker;
