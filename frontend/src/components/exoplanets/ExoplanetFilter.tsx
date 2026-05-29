import type { Exoplanet } from "../../types";

type Filter = Exoplanet["classification"] | "ALL";

interface Props {
  active: Filter;
  onChange: (filter: Filter) => void;
  total: number;
}

const filters: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "CANDIDATE", label: "Candidatos" },
  { value: "FALSE_POSITIVE", label: "Falsos positivos" },
];

const ExoplanetFilter = ({ active, onChange, total }: Props) => (
  <div
    style={{
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
      flexWrap: "wrap",
    }}
  >
    {filters.map(({ value, label }) => (
      <button
        key={value}
        onClick={() => onChange(value)}
        style={{
          background: active === value ? "#6366f1" : "#1e1e3a",
          color: active === value ? "#fff" : "#94a3b8",
          border: "1px solid",
          borderColor: active === value ? "#6366f1" : "#334155",
          borderRadius: "6px",
          padding: "6px 14px",
          cursor: "pointer",
          fontSize: "0.85rem",
          transition: "all 0.2s",
        }}
      >
        {label}
      </button>
    ))}
    <span
      style={{ color: "#475569", fontSize: "0.8rem", marginLeft: "0.5rem" }}
    >
      {total} resultados
    </span>
  </div>
);

export default ExoplanetFilter;
