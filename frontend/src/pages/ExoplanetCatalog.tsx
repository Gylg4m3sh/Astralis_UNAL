import { useState } from "react";
import { useExoplanets } from "../hooks/useExoplanets";
import ExoplanetCard from "../components/exoplanets/ExoplanetCard";
import ExoplanetFilter from "../components/exoplanets/ExoplanetFilter";
import type { Exoplanet } from "../types";

type Filter = Exoplanet["classification"] | "ALL";

const ExoplanetCatalog = () => {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, loading, error } = useExoplanets({
    filter: filter === "ALL" ? undefined : filter,
  });

  return (
    <div
      style={{
        padding: "2rem",
        background: "#050510",
        minHeight: "100vh",
        color: "#e2e8f0",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>Catálogo de Exoplanetas</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Datos del telescopio Kepler — NASA Exoplanet Archive
      </p>

      <ExoplanetFilter
        active={filter}
        onChange={setFilter}
        total={data?.total ?? 0}
      />

      <div style={{ marginTop: "1.5rem" }}>
        {loading && <p style={{ color: "#64748b" }}>Cargando...</p>}
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {data && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {data.data.map((planet) => (
              <ExoplanetCard key={planet.id} exoplanet={planet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExoplanetCatalog;
