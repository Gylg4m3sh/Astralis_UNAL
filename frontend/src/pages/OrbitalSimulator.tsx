import { useRef, useState, useCallback } from "react";
import OrbitalCanvas, {
  type OrbitalCanvasHandle,
  type PlanetData,
} from "../components/orbital/OrbitalCanvas";
import PlanetViewer from "../components/orbital/PlanetViewer";

const SPEEDS = [
  { label: "1×", value: 1 },
  { label: "10×", value: 10 },
  { label: "50×", value: 50 },
  { label: "100×", value: 100 },
];

const PlanetPanel = ({
  planet,
  onClose,
  onView,
}: {
  planet: PlanetData;
  onClose: () => void;
  onView: () => void;
}) => (
  <div
    style={{
      position: "absolute",
      top: "1.5rem",
      right: "1.5rem",
      zIndex: 20,
      width: "260px",
      background: "rgba(7,7,26,0.92)",
      border: `1px solid ${planet.glowColor}55`,
      borderRadius: "16px",
      padding: "1.5rem",
      backdropFilter: "blur(12px)",
      boxShadow: `0 0 30px ${planet.glowColor}22`,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: planet.color,
            boxShadow: `0 0 10px ${planet.glowColor}`,
            flexShrink: 0,
          }}
        />
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--color-text)",
          }}
        >
          {planet.name.toUpperCase()}
        </h3>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-muted)",
          cursor: "pointer",
          fontSize: "1.1rem",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        marginBottom: "1rem",
      }}
    >
      {[
        { label: "Distancia al Sol", value: `${planet.distanceAU} AU` },
        {
          label: "Período orbital",
          value: `${planet.orbitalPeriodDays.toLocaleString()} días`,
        },
        {
          label: "Diámetro",
          value: `${planet.diameterKm.toLocaleString()} km`,
        },
        { label: "Lunas", value: planet.moons.toString() },
      ].map(({ label, value }) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.7rem",
              color: "var(--color-muted)",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.8rem",
              color: planet.glowColor,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
    <div
      style={{
        height: "1px",
        background: `${planet.glowColor}22`,
        marginBottom: "0.75rem",
      }}
    />
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.72rem",
        color: "var(--color-muted)",
        lineHeight: 1.6,
        fontStyle: "italic",
      }}
    >
      "{planet.fact}"
    </p>
    <button
      onClick={onView}
      style={{
        width: "100%",
        padding: "0.6rem",
        borderRadius: "8px",
        marginTop: "0.75rem",
        background: `${planet.glowColor}22`,
        border: `1px solid ${planet.glowColor}55`,
        color: planet.glowColor,
        cursor: "pointer",
        fontFamily: "var(--font-display)",
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
      }}
    >
      VER EN 3D →
    </button>
  </div>
);

const OrbitalSimulator = () => {
  const canvasRef = useRef<OrbitalCanvasHandle>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [realScale, setRealScale] = useState(false);
  const [viewerPlanet, setViewerPlanet] = useState<PlanetData | null>(null);

  const handlePlanetClick = useCallback((planet: PlanetData | null) => {
    setSelectedPlanet(planet);
  }, []);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    canvasRef.current?.setPaused(next);
  };

  const handleSpeed = (v: number) => {
    setSpeed(v);
    canvasRef.current?.setSpeedMultiplier(v);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 57px)",
        overflow: "hidden",
      }}
    >
      <OrbitalCanvas ref={canvasRef} onPlanetClick={handlePlanetClick} realScale={realScale} />

      {/* Header flotante */}
      <div
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "2rem",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.3rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            marginBottom: "0.25rem",
            color: "var(--color-text)",
            textShadow: "0 0 20px rgba(99,102,241,0.8)",
          }}
        >
          SIMULADOR ORBITAL
        </h1>
      </div>
      {/* Controles flotantes */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(7,7,26,0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--color-border)",
          borderRadius: "999px",
          padding: "0.5rem 1rem",
        }}
      >
        <button
          onClick={togglePause}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            cursor: "pointer",
            background: paused ? "var(--color-accent)" : "transparent",
            border: "1px solid var(--color-accent)",
            color: paused ? "#fff" : "var(--color-accent)",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {paused ? "▶" : "⏸"}
        </button>

        <div
          style={{
            width: "1px",
            height: "24px",
            background: "var(--color-border)",
          }}
        />

        {SPEEDS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleSpeed(value)}
            style={{
              padding: "4px 12px",
              borderRadius: "999px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              background:
                speed === value ? "var(--color-accent)" : "transparent",
              color: speed === value ? "#fff" : "var(--color-muted)",
              border: `1px solid ${speed === value ? "var(--color-accent)" : "transparent"}`,
              transition: "all 0.2s",
            }}
          >
            {label}
          </button>
        ))}

        <div
          style={{
            width: "1px",
            height: "24px",
            background: "var(--color-border)",
          }}
        />

        <button
          onClick={() => setRealScale(prev => !prev)}
          style={{
            padding: "4px 12px",
            borderRadius: "999px",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            background: realScale ? "var(--color-accent)" : "transparent",
            color: realScale ? "#fff" : "var(--color-muted)",
            border: `1px solid ${realScale ? "var(--color-accent)" : "transparent"}`,
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          {realScale ? "Escalas Reales" : "Escala Visual"}
        </button>
      </div>
      {selectedPlanet && (
        <PlanetPanel
          planet={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
          onView={() => {
            setViewerPlanet(selectedPlanet);
            setSelectedPlanet(null);
          }}
        />
      )}
      // Agrega el PlanetViewer al final, antes del cierre del div principal:
      <div style={{ display: viewerPlanet ? "block" : "none" }}>
        {viewerPlanet && (
          <PlanetViewer
            planet={viewerPlanet}
            onClose={() => setViewerPlanet(null)}
          />
        )}
      </div>{" "}
    </div>
  );
};

export default OrbitalSimulator;
