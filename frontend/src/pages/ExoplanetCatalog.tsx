import { useState } from "react";
import { useExoplanets } from "../hooks/useExoplanets";
import ExoplanetCard from "../components/exoplanets/ExoplanetCard";
import ExoplanetFilter from "../components/exoplanets/ExoplanetFilter";
import type { Exoplanet } from "../types";

type Filter = Exoplanet["classification"] | "ALL";

const ExoplanetCatalog = () => {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const { data, loading, error } = useExoplanets({
    page,
    filter: filter === "ALL" ? undefined : filter,
  });

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

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
        onChange={handleFilterChange}
        total={data?.total ?? 0}
      />

      <div style={{ marginTop: "1.5rem" }}>
        {loading && <p style={{ color: "#64748b" }}>Cargando...</p>}
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        {data && (
          <>
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

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1.5rem",
                  marginTop: "2.5rem",
                  padding: "1rem 0",
                }}
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    background: "transparent",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    padding: "0.5rem 1.2rem",
                    color: page === 1 ? "#475569" : "#e2e8f0",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8rem",
                    transition: "all 0.2s",
                  }}
                >
                  &larr; Anterior
                </button>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                  }}
                >
                  Página <strong style={{ color: "#6366f1" }}>{page}</strong> de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  style={{
                    background: "transparent",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    padding: "0.5rem 1.2rem",
                    color: page >= totalPages ? "#475569" : "#e2e8f0",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8rem",
                    transition: "all 0.2s",
                  }}
                >
                  Siguiente &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExoplanetCatalog;
