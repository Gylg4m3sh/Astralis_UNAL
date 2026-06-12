import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState(0); // segundos restantes
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown
  useEffect(() => {
    if (lockout <= 0) return;
    timerRef.current = setInterval(() => {
      setLockout((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setAttempts(0);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [lockout]);

  const isLocked = lockout > 0;

  const handleSubmit = async () => {
    if (isLocked) return;
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate("/");
    } catch (e: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockout(LOCKOUT_SECONDS);
        setError(`Demasiados intentos. Espera ${LOCKOUT_SECONDS} segundos.`);
      } else {
        setError(
          `${e.message || "Error al iniciar sesión"} (intento ${newAttempts}/${MAX_ATTEMPTS})`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: "var(--color-deep)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-void)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "40%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "2.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              fontWeight: 900,
              letterSpacing: "0.3em",
              color: "var(--color-accent)",
              textShadow: "0 0 20px rgba(99,102,241,0.6)",
              marginBottom: "0.5rem",
            }}
          >
            ASTRALIS
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "var(--color-text)",
              marginBottom: "0.25rem",
            }}
          >
            INICIAR SESIÓN
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              color: "var(--color-muted)",
            }}
          >
            Observatorio Astronómico Nacional · UNAL
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <label
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@unal.edu.co"
              disabled={isLocked}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ ...inputStyle, opacity: isLocked ? 0.5 : 1 }}
            />
          </div>
          <div>
            <label
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLocked}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-accent)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ ...inputStyle, opacity: isLocked ? 0.5 : 1 }}
            />
          </div>
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-false-positive)",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || isLocked}
          style={{
            width: "100%",
            padding: "0.85rem",
            borderRadius: "8px",
            cursor: loading || isLocked ? "not-allowed" : "pointer",
            fontFamily: "var(--font-display)",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            background: isLocked
              ? "#7f1d1d"
              : loading
                ? "var(--color-border)"
                : "var(--color-accent)",
            color: "#fff",
            border: "none",
            boxShadow:
              isLocked || loading ? "none" : "0 0 20px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
          }}
        >
          {isLocked
            ? `Bloqueado ${lockout}s`
            : loading
              ? "Verificando..."
              : "Entrar"}
        </button>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-muted)",
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            style={{ color: "var(--color-accent)", textDecoration: "none" }}
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
