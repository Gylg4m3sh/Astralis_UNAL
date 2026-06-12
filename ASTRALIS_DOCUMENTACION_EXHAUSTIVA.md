# Documentación Técnica Exhaustiva — Proyecto Astralis

Este documento expone en profundidad todos los desarrollos e implementaciones técnicas aplicadas en el proyecto **Astralis**, clasificándolas detalladamente según los cuatro roles técnicos oficiales (E1 a E4) y destacando las funcionalidades e implementaciones de código más interesantes.

---

## 🏛️ Estructura General del Proyecto
Astralis está compuesto por un backend asíncrono con **FastAPI**, un frontend interactivo en **React** con **TypeScript**, y una suite de infraestructura y pruebas automatizada orquestada mediante **Docker Compose** y **Kubernetes**.

---

## 1. ⚙️ Rol E1: Backend & API Engineer
El ingeniero de backend se enfoca en el diseño de la API RESTful, el modelado relacional y la sincronización asíncrona de datos desde catálogos externos.

### 🌟 Funcionalidades Interesantes & Implementaciones de Código

#### A. Cliente de Descarga Dinámica TAP NASA (ADQL)
*Archivo:* [nasa.py](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/backend/app/services/nasa.py)

Para evitar un catálogo con placeholders estáticos, el backend implementa una función de descarga asíncrona de datos en tiempo real directo del **NASA Exoplanet Archive** mediante peticiones de Protocolo de Acceso a Tablas (TAP) con sentencias ADQL (Astronomical Data Query Language).

El backend descarga más de **9,500 exoplanetas** al arrancar si no detecta el archivo local `kepler_exoplanets.csv`, actuando como una memoria caché local:

```python
def _load_df() -> pd.DataFrame:
    global _df_cache
    if _df_cache is not None:
        return _df_cache

    if not os.path.exists(CSV_PATH):
        try:
            import httpx
            os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
            # Query ADQL sobre la tabla 'cumulative' de la NASA
            url = (
                "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?"
                "query=select+kepid,kepler_name,kepoi_name,koi_period,koi_prad,koi_teq,koi_disposition,koi_score+from+cumulative"
                "&format=csv"
            )
            response = httpx.get(url, timeout=30.0)
            response.raise_for_status()
            with open(CSV_PATH, "wb") as f:
                f.write(response.content)
        except Exception as e:
            # Fallback en caso de error de red
            print(f"Error al descargar exoplanetas: {e}")
            if not os.path.exists(CSV_PATH):
                return _mock_df()
```

#### B. Generador Matemático de Curvas de Luz por Tránsito
*Archivo:* [exoplanets.py](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/backend/app/routers/exoplanets.py)

El endpoint `/api/exoplanets/{exoplanet_id}/lightcurve` computa en tiempo real los puntos de flujo lumínico normalizado para simular la disminución de brillo cuando un planeta pasa frente a su estrella.
*   Usa el radio del exoplaneta ($R_p$) y el período orbital para calcular la duración y profundidad del tránsito lumínico ($Depth \propto (R_p / R_*)^2$).
*   Añade ruido Gaussiano realista a las mediciones fotométricas para simular el ruido instrumental de un telescopio espacial:

```python
# Fórmula matemática aplicada para la atenuación y el ruido fotométrico:
# Durante el tránsito (tiempo t entre inicio y fin):
# Flux = 1.0 - depth
# Fuera del tránsito:
# Flux = 1.0
# Se le añade ruido gaussiano:
flux_noise = flux + random.normalvariate(0, 0.0008)
```

#### C. Tolerancia a Fallos y Mecanismo Fallback de Base de Datos
*Archivo:* [database.py](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/backend/app/core/database.py)

Para que el proyecto se pueda inicializar y probar localmente de manera inmediata sin configurar obligatoriamente un motor local de Postgres (lo cual es vital para entornos de pruebas rápidas y pipelines de CI/CD), la base de datos detecta si la librería `psycopg2` está ausente o falla la conexión. En tal caso, redirige de forma transparente la persistencia a un motor de base de datos **SQLite en memoria**:

```python
try:
    if "pytest" in sys.modules or not psycopg2_installed:
        # SQLite temporal para pruebas y desarrollo libre de dependencias complejas
        DATABASE_URL = "sqlite:///./test.db"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL)
except Exception:
    DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(DATABASE_URL)
```

---

## 2. 🧪 Rol E2: QA, Testing & DevOps Engineer
Este rol consolidado unifica el aseguramiento de la calidad y la automatización de la infraestructura, garantizando estabilidad en el código y eficiencia en el ciclo de entrega.

### 🌟 Funcionalidades Interesantes & Implementaciones de Código

#### A. Validación de Cuerpos Celestes del Sistema Solar (Pruebas Unitarias)
*Archivo:* [test_simulation.py](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/backend/tests/test_simulation.py)

Verifica que el simulador reconozca y retorne tanto los planetas estándar como los tres nuevos cuerpos del sistema solar exterior (Urano, Neptuno y el planeta enano Plutón):

```python
def test_simulation_bodies():
    response = client.get("/api/simulation/bodies")
    assert response.status_code == 200
    bodies = response.json()
    assert isinstance(bodies, list)
    
    body_ids = [body["id"] for body in bodies]
    expected_bodies = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
    for body_id in expected_bodies:
        assert body_id in body_ids, f"{body_id} no se encuentra en la simulación"
```

#### B. Pipeline de Automatización con GitHub Actions
*Archivo:* [.github/workflows/ci.yml](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/.github/workflows/ci.yml)

El flujo de integración continua está configurado para ejecutarse en paralelo y validar tanto frontend como backend:
*   Instala dependencias, ejecuta chequeos de formato (`flake8`), y corre los tests con un umbral de cobertura mínimo del **60%**.
*   Construye las imágenes Docker correspondientes para comprobar que los Dockerfiles compilan perfectamente antes de dar luz verde para la mezcla a la rama `main`.

#### C. Contenerización Multi-etapa (Vite -> Nginx)
*Archivo:* [Dockerfile (frontend)](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/frontend/Dockerfile)

El frontend utiliza una estrategia de compilación en dos etapas (Multi-Stage Build) para reducir al mínimo el tamaño de la imagen final servida en Kubernetes:
1.  **Etapa de compilación (Node.js):** Descarga dependencias y compila los archivos estáticos optimizados con Vite en la carpeta `/app/dist`.
2.  **Etapa de servicio (Nginx):** Copia únicamente el directorio `/app/dist` final y descarta todo el entorno pesado de Node.js. Expone Nginx en el puerto `80`.

#### D. Solución al Bug de Red de Nginx en Kubernetes (DNS Resolving)
*Archivo:* [nginx.conf](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/frontend/nginx.conf) y [backend.yaml](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/k8s/backend.yaml)

Al desplegar en Kubernetes, la directiva `proxy_pass http://backend:8000/api/` fallaba en Nginx debido a que el servicio de red de Kubernetes originalmente se llamaba `astralis-backend`. Nginx crasheaba al intentar arrancar porque su validador de configuración no encontraba el host `backend`.

La solución consistió en renombrar el servicio en los manifiestos de Kubernetes a `backend` manteniendo el pod mapeado a `astralis-backend`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend  # Nombre coincidente con proxy_pass de Nginx
spec:
  ports:
    - port: 8000
  selector:
    app: astralis-backend  # Vincula el puerto de red al pod del backend
```

#### E. Script de Automatización de Despliegue en PowerShell
*Archivo:* [deploy.ps1](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/deploy.ps1)

Se diseñó un script interactivo en PowerShell que automatiza todo el flujo del despliegue tanto para Docker Compose como para Kubernetes. Detecta si el clúster activo es Minikube y se encarga de subir las imágenes al entorno simulado, aplicar los manifiestos ordenadamente (`secrets` -> `configmaps` -> `db` -> `backend` -> `frontend`), y sugerir los comandos finales de acceso y diagnóstico en tiempo real.

---

## 3. 🧠 Rol E3: Data Science & Machine Learning Engineer
El rol de Ciencia de Datos fundamenta científicamente el proyecto mediante la simulación de órbitas por gravedad y la clasificación de candidatos a exoplanetas.

### 🌟 Funcionalidades Interesantes & Implementaciones de Código

#### A. Análisis y Clasificación del Dataset Kepler
*Archivo:* [astralis_e3_fase1_fixed.ipynb](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/astralis_e3_fase1_fixed.ipynb)

*   **Ingeniería de Características:** Limpieza y selección de parámetros físicos medidos por Kepler (profundidad de tránsito `koi_depth`, período orbital `koi_period`, radio planetario `koi_prad` y temperatura de equilibrio `koi_teq`).
*   **Modelado Predictivo:** Clasificación binaria (`CONFIRMED` frente a `FALSE_POSITIVE`) usando modelos avanzados (Bosques Aleatorios y Gradient Boosting).
*   **Evaluación del Rendimiento:** Reporte completo evaluando el F1-Score, precisión y recall, y visualización de la matriz de confusión para asegurar que el modelo sea robusto ante falsos positivos provocados por estrellas binarias eclipsantes.

#### B. Integración Gravitatoria N-Cuerpos
*Directorio:* `science/src/`

*   Implementación de algoritmos gravitacionales usando métodos Runge-Kutta para simular órbitas keplerianas.
*   Usa el principio $T^2 = a^3 / M$ para calcular y contrastar los períodos simulados contra la realidad orbital, asegurando que las trayectorias de los planetas modelados en las APIs sigan de manera fiel las leyes de la física newtoniana.

---

## 4. 💻 Rol E4: Frontend & Visualización Engineer
El frontend es la cara interactiva de Astralis, centrado en visualizaciones de alta fidelidad estética y rendimiento dinámico en tiempo real.

### 🌟 Funcionalidades Interesantes & Implementaciones de Código

#### A. Simulador Orbital 2D de Alto Rendimiento en HTML5 Canvas
*Archivo:* [OrbitalCanvas.tsx](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/frontend/src/components/orbital/OrbitalCanvas.tsx)

En lugar de utilizar complejas librerías 3D de alto impacto en memoria, se desarrolló un simulador orbital optimizado usando la API nativa de Canvas 2D de HTML5.
*   **Estrellas de Fondo y Nebulosas Dinámicas:** Generación procedural de estrellas y nubes de gas en un lienzo *Nebula* secundario en caché para mejorar los cuadros por segundo (FPS).
*   **Interactividad con Cámara Física:** Soporte para arrastre de cámara (Pan) y zoom hacia el cursor del mouse, lo cual permite desplazarse libremente a lo largo del sistema solar:

```typescript
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const rect = canvas.getBoundingClientRect()
  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width)
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height)
  
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * zoomFactor))

  // Escalamiento relativo con respecto a la posición del cursor
  const scale = newZoom / zoomRef.current
  panRef.current = {
    x: mouseX - (mouseX - (sizeRef.current.W / 2 + panRef.current.x)) * scale - sizeRef.current.W / 2,
    y: mouseY - (mouseY - (sizeRef.current.H / 2 + panRef.current.y)) * scale - sizeRef.current.H / 2,
  }
  zoomRef.current = newZoom
}
```

#### B. Mecanismo de Escala Real de Unidades Astronómicas (AU)
El lienzo calcula el radio de la órbita de los planetas en función de su distancia física real en AU multiplicada por un factor de escala ajustable. 
*   Para acomodar la inmensidad del sistema solar exterior (Pluto a $39.48\text{ AU}$ frente a Mercurio a $0.39\text{ AU}$), se habilitaron límites de zoom extremos (`MIN_ZOOM = 0.02`, `MAX_ZOOM = 15`).
*   Al activar la **Escala Real**, se vacía el rastro orbital (trail) para prevenir saltos gráficos molestos en la pantalla del usuario:

```typescript
useEffect(() => {
  const scaleFactor = 150
  planetsRef.current.forEach(p => {
    const original = PLANETS.find(orig => orig.id === p.id)
    if (original) {
      p.orbitRadius = realScale 
        ? original.distanceAU * scaleFactor 
        : original.orbitRadius
    }
  })
  // Reseteo de trails
  Object.keys(trailsRef.current).forEach(k => {
    trailsRef.current[k] = []
  })
}, [realScale])
```

#### C. Seguimiento Geográfico de la ISS
*Archivo:* [useISS.ts](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/frontend/src/hooks/useISS.ts)

Consumo continuo en segundo plano de telemetría de satélites mediante React Hooks personalizados, proporcionando actualizaciones de latitud/longitud en tiempo real y gestionando correctamente los intervalos de actualización y des-suscripción para evitar fugas de memoria.
