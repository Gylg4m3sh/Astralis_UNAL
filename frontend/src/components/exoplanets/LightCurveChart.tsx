import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import type { LightCurvePoint } from "../../services/lightCurve";

interface Props {
  data: LightCurvePoint[];
  planetName: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontFamily: "var(--font-body)",
        fontSize: "0.75rem",
      }}
    >
      <p style={{ color: "var(--color-muted)", marginBottom: "4px" }}>
        t = {label}h
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(5)}
        </p>
      ))}
    </div>
  );
};

const LightCurveChart = ({ data, planetName }: Props) => (
  <div
    style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "16px",
      padding: "1.5rem",
    }}
  >
    <div style={{ marginBottom: "1rem" }}>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-text)",
          marginBottom: "0.25rem",
        }}
      >
        Curva de Luz de Tránsito
      </h3>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          color: "var(--color-muted)",
        }}
      >
        {planetName} · Flujo normalizado vs tiempo
      </p>
    </div>

    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />

        <XAxis
          dataKey="time"
          stroke="var(--color-muted)"
          tick={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            fill: "#4a5568",
          }}
          label={{
            value: "Tiempo (horas)",
            position: "insideBottom",
            offset: -4,
            style: {
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fill: "#4a5568",
            },
          }}
        />
        <YAxis
          stroke="var(--color-muted)"
          tick={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            fill: "#4a5568",
          }}
          domain={["auto", "auto"]}
          label={{
            value: "Flujo relativo",
            angle: -90,
            position: "insideLeft",
            offset: -4,
            style: {
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fill: "#4a5568",
            },
          }}
        />

        <Tooltip content={<CustomTooltip />} />

        <ReferenceLine
          x={0}
          stroke="rgba(99,102,241,0.3)"
          strokeDasharray="4 4"
          label={{
            value: "Centro",
            style: {
              fontFamily: "var(--font-body)",
              fontSize: 10,
              fill: "rgba(99,102,241,0.6)",
            },
          }}
        />
        <ReferenceLine
          y={1.0}
          stroke="rgba(255,255,255,0.06)"
          strokeDasharray="2 4"
        />

        <Legend
          wrapperStyle={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            paddingTop: "8px",
          }}
        />

        {/* Flujo con ruido (observado) */}
        <Line
          type="monotone"
          dataKey="fluxNoise"
          name="Observado"
          stroke="#6366f1"
          strokeWidth={1.5}
          dot={false}
          strokeOpacity={0.7}
        />
        {/* Modelo teórico */}
        <Line
          type="monotone"
          dataKey="flux"
          name="Modelo"
          stroke="#4ade80"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>

    {/* Info de la caída */}
    <div
      style={{
        marginTop: "1rem",
        display: "flex",
        gap: "2rem",
        flexWrap: "wrap",
        paddingTop: "1rem",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {[
        {
          label: "Profundidad",
          value: `${((1 - Math.min(...data.map((d) => d.flux))) * 100).toFixed(3)}%`,
        },
        {
          label: "Duración",
          value: `${(data.filter((d) => d.flux < 0.9999).length > 0
            ? Math.abs(data.find((d) => d.flux < 0.9999)!.time) * 2
            : 0
          ).toFixed(2)}h`,
        },
        { label: "Puntos", value: data.length.toString() },
      ].map(({ label, value }) => (
        <div key={label}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--color-muted)",
              marginBottom: "2px",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-accent)",
            }}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default LightCurveChart;
