import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { PlanetData } from "./OrbitalCanvas";

const TEXTURES: Record<string, string> = {
  mercury: "/textures/mercury.jpg",
  venus: "/textures/venus.jpg",
  earth: "/textures/earth.jpg",
  mars: "/textures/mars.jpg",
  jupiter: "/textures/jupiter.jpg",
  saturn: "/textures/saturn.jpg",
  neptune: "/textures/neptune.jpg",
  uranus: "/textures/uranus.jpg",
  sun: "/textures/sun.jpg",
  moon: "/textures/moon.jpg",
};

interface Props {
  planet: PlanetData;
  onClose: () => void;
}

const PlanetViewer = ({ planet, onClose }: Props) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 64, 64);

    const textureUrl = TEXTURES[planet.id];

    const material = textureUrl
      ? new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load(textureUrl),
          shininess: 30,
        })
      : new THREE.MeshPhongMaterial({
          color: new THREE.Color(planet.color),
          shininess: 30,
          ...(planet.id === "sun" && {
            emissive: new THREE.Color("#ff6600"),
            emissiveIntensity: 0.3,
          }),
        });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    if (planet.rings) {
      const ringGeo = new THREE.RingGeometry(1.4, 2.2, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xe8d5a3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      scene.add(ring);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(3000);
    for (let i = 0; i < 3000; i++)
      starPositions[i] = (Math.random() - 0.5) * 200;
    starGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3),
    );
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 });
    scene.add(new THREE.Points(starGeo, starMat));

    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const velocity = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      velocity.x = (e.clientY - prevMouse.y) * 0.01;
      velocity.y = (e.clientX - prevMouse.x) * 0.01;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.min(
        8,
        Math.max(1.5, camera.position.z + e.deltaY * 0.005),
      );
    };

    mount.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    mount.addEventListener("wheel", onWheel, { passive: false });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        velocity.y *= 0.95;
        velocity.x *= 0.95;
      }
      mesh.rotation.y += velocity.y + 0.003;
      mesh.rotation.x += velocity.x;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      mount.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, [planet]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(3,3,15,0.97)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Barra superior */}
      <div
        style={{
          width: "100%",
          padding: "5rem 1.5rem 1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted)",
            borderRadius: "8px",
            padding: "6px 16px",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
            e.currentTarget.style.color = "var(--color-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-muted)";
          }}
        >
          ← Volver al simulador
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: planet.color,
              boxShadow: `0 0 8px ${planet.glowColor}`,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "var(--color-text)",
            }}
          >
            {planet.name.toUpperCase()} · VISTA 3D
          </span>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            color: "var(--color-muted)",
          }}
        >
          Arrastra para rotar · Scroll para zoom
        </span>
      </div>

      {/* Contenido */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Canvas 3D */}
        <div ref={mountRef} style={{ flex: 1, height: "100%" }} />

        {/* Panel de datos */}
        <div
          style={{
            width: "300px",
            padding: "2rem",
            flexShrink: 0,
            borderLeft: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            overflowY: "auto",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                fontWeight: 900,
                letterSpacing: "0.1em",
                color: planet.glowColor,
                marginBottom: "0.25rem",
              }}
            >
              {planet.name.toUpperCase()}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--color-muted)",
              }}
            >
              Sistema Solar · {planet.distanceAU} AU del Sol
            </p>
          </div>

          <div style={{ height: "1px", background: `${planet.glowColor}33` }} />

          {[
            {
              label: "Período orbital",
              value: `${planet.orbitalPeriodDays.toLocaleString()} días`,
            },
            {
              label: "Diámetro",
              value: `${planet.diameterKm.toLocaleString()} km`,
            },
            { label: "Lunas", value: planet.moons.toString() },
            { label: "Distancia al Sol", value: `${planet.distanceAU} AU` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.72rem",
                  color: "var(--color-muted)",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: planet.glowColor,
                }}
              >
                {value}
              </span>
            </div>
          ))}

          <div style={{ height: "1px", background: `${planet.glowColor}33` }} />

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-muted)",
              lineHeight: 1.7,
              fontStyle: "italic",
            }}
          >
            "{planet.fact}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanetViewer;
