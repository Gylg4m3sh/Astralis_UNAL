import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "⬡",
    title: "Simulador Orbital",
    description:
      "Simulación N-cuerpos en tiempo real con datos del JPL Horizons System.",
    route: "/simulator",
  },
  {
    icon: "◈",
    title: "Catálogo de Exoplanetas",
    description:
      "Más de 9.000 candidatos del telescopio Kepler clasificados por IA.",
    route: "/exoplanets",
  },
  {
    icon: "◎",
    title: "ISS Tracker",
    description:
      "Posición de la Estación Espacial Internacional actualizada en vivo.",
    route: "/iss",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.15 + 0.05,
      opacity: Math.random() * 0.7 + 0.2,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--color-void)",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Glow central */}
      <div
        style={{
          position: "absolute",
          zIndex: 0,
          pointerEvents: "none",
          top: "25%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)",
        }}
      />

      {/* Hero */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "7rem 2rem 4rem",
        }}
      >
        {/* Badge */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "4px 16px",
            borderRadius: "999px",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            border: "1px solid var(--color-accent)",
            color: "var(--color-accent)",
            background: "rgba(99,102,241,0.08)",
            fontFamily: "var(--font-body)",
          }}
        >
          Observatorio Astronómico Nacional · UNAL 2026
        </div>

        {/* Título */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 10vw, 7rem)",
            fontWeight: 900,
            letterSpacing: "0.2em",
            marginBottom: "1rem",
            color: "var(--color-text)",
            textShadow:
              "0 0 30px rgba(99,102,241,0.8), 0 0 60px rgba(99,102,241,0.4)",
          }}
        >
          ASTRALIS
        </h1>

        {/* Subtítulo */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.95rem",
            color: "var(--color-muted)",
            maxWidth: "520px",
            lineHeight: 1.8,
            marginBottom: "0.75rem",
          }}
        >
          Plataforma de simulación, visualización y predicción de fenómenos
          astronómicos con datos reales de la NASA.
        </p>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.7rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: "2.5rem",
          }}
        >
          Fundado en 1803 · Bogotá, Colombia
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => navigate("/simulator")}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            style={{
              padding: "0.75rem 2.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: "var(--color-accent)",
              color: "#fff",
              border: "1px solid var(--color-accent)",
              boxShadow: "0 0 20px rgba(99,102,241,0.4)",
              transition: "opacity 0.2s",
            }}
          >
            Explorar
          </button>
          <button
            onClick={() => navigate("/exoplanets")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--color-accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--color-border)")
            }
            style={{
              padding: "0.75rem 2.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: "transparent",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              transition: "border-color 0.2s",
            }}
          >
            Exoplanetas
          </button>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          gap: "4rem",
          flexWrap: "wrap",
          padding: "0 2rem 4rem",
        }}
      >
        {[
          { value: "9.000+", label: "Candidatos Kepler" },
          { value: "∞", label: "Cuerpos simulables" },
          { value: "1s", label: "Actualización ISS" },
          { value: "1803", label: "Año de fundación" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.2rem",
                fontWeight: 900,
                color: "var(--color-accent)",
                marginBottom: "0.25rem",
              }}
            >
              {value}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </section>

      {/* Feature cards */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0 2rem 6rem",
        }}
      >
        {FEATURES.map(({ icon, title, description, route }) => (
          <button
            key={title}
            onClick={() => navigate(route)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(99,102,241,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              textAlign: "left",
              borderRadius: "16px",
              padding: "2rem",
              cursor: "pointer",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "2.5rem", color: "var(--color-accent)" }}>
              {icon}
            </span>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--color-text)",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                color: "var(--color-muted)",
                lineHeight: 1.7,
              }}
            >
              {description}
            </p>
          </button>
        ))}
      </section>
    </div>
  );
};

export default Home;
