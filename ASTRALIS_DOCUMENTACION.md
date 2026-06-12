# Documentación Técnica Unificada — Proyecto Astralis

Este documento consolida la arquitectura, el diseño, los detalles de implementación y los flujos de operación del proyecto **Astralis**, una plataforma web avanzada de divulgación e investigación astronómica. La documentación está redactada utilizando un estilo de redacción pasivo y en pasado (ej. "se realizó", "se implementó") para detallar de manera exhaustiva el funcionamiento del sistema en sus cuatro áreas técnicas fundamentales: Frontend, Backend, Machine Learning y DevOps.

---

## 🏛️ Estructura General del Proyecto

El sistema está compuesto por una arquitectura multi-capa desacoplada que incluye:
1. **Frontend**: Una SPA (Single Page Application) reactiva desarrollada con React, TypeScript y Vite.
2. **Backend**: Una API asíncrona construida sobre FastAPI que administra la lógica de negocio y los datos.
3. **Machine Learning (Inferencia)**: Un microservicio de predicción y re-entrenamiento encapsulado en FastAPI.
4. **Ciencia de Datos (Modelado)**: Simulaciones de órbita y análisis de clasificación kepleriana documentados en Jupyter Notebooks.
5. **DevOps & Infraestructura**: Configuraciones de contenerización con Docker Compose y manifiestos de orquestación en Kubernetes.

---

## 1. 💻 Frontend & Visualización

La interfaz de usuario se diseñó y estructuró bajo una arquitectura SPA modular y tipada, garantizando un renderizado eficiente de simulaciones físicas e interfaces interactivas de datos astronómicos.

### Stack Tecnológico
- **Core:** React 18 con TypeScript para un desarrollo seguro y estructurado.
- **Herramienta de Compilación:** Vite para optimizar los tiempos de carga y desarrollo.
- **Visualización 2D:** HTML5 Canvas API para soportar el renderizado fluido del simulador orbital.
- **Visualización 3D:** Three.js para la exploración interactiva de cuerpos planetarios.
- **Gráficos Estadísticos:** Recharts para plasmar las curvas de luz de los exoplanetas.
- **Cliente HTTP:** Axios, configurado con interceptores para inyectar automáticamente tokens de autenticación JWT.
- **Estilos:** CSS nativo (Vanilla CSS) utilizando variables globales con paletas HSL oscuras para mantener una estética visual premium y moderna.

### Componentes y Vistas Principales

#### A. Simulador Orbital (Sistema Solar 2D)
Se implementó un motor de renderizado utilizando Canvas API para recrear el Sol y los 9 cuerpos celestes principales (Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano, Neptuno y el planeta enano Plutón).
- **Física Orbital:** Las posiciones angulares de los planetas se calcularon de acuerdo con la Tercera Ley de Kepler, simulando velocidades orbitales realistas en función de su distancia al Sol.
- **Control de Velocidad:** Se integraron controles interactivos que permiten modificar el paso del tiempo en la simulación (1x, 10x, 50x, 100x).
- **Modos de Escala:**
  - *Escala Visual:* Se distribuyeron las órbitas uniformemente para facilitar la observación de todos los planetas en una sola pantalla.
  - *Escala Real:* Se calcularon los radios reales de las órbitas en función de sus Unidades Astronómicas (AU), permitiendo apreciar el vacío real del sistema solar exterior (requiere uso de zoom y desplazamiento).
- **Cámara Interactiva:** Se implementaron gestos de arrastre (pan) para desplazar el plano de visión y zoom basado en la rueda del ratón (scroll) enfocado dinámicamente en la posición del cursor.
- **Panel Informativo:** Se diseñó un menú lateral que se despliega al hacer clic sobre cualquier cuerpo celeste, mostrando datos reales como diámetro, período, distancia, número de satélites y curiosidades científicas.

#### B. Vista 3D de Planetas
Se desarrolló un componente tridimensional utilizando Three.js para ofrecer una exploración inmersiva.
- **Modelado:** Se mapearon texturas esféricas de alta resolución en mallas tridimensionales con rotación automática e inercia física en el arrastre manual.
- **Saturno:** Se diseñó una geometría de tipo `RingGeometry` específica para representar con fidelidad los anillos del planeta.

#### C. Catálogo de Exoplanetas
Se estructuró una interfaz interactiva de consulta que consume el catálogo consolidado de exoplanetas del backend.
- **Filtros Dinámicos:** Se implementó filtrado por disposición oficial de la NASA (`CONFIRMED`, `CANDIDATE`, `FALSE_POSITIVE`).
- **Paginación:** Se dispuso un sistema de paginación eficiente para navegar entre los más de 9,000 registros del conjunto de datos Kepler.

#### D. Detalle de Exoplaneta y Curvas de Luz
Se diseñó una sección individual para analizar cada exoplaneta seleccionado.
- **Curva de Luz de Tránsito:** Se integró un gráfico de dispersión con Recharts que muestra el flujo lumínico de la estrella en función del tiempo. La curva representa la atenuación que sufre la luz cuando el exoplaneta pasa frente a ella, incorporando ruido aleatorio gaussiano simulado en tiempo real.

#### E. Seguimiento en Tiempo Real de la ISS (ISS Tracker)
Se construyó un mapa interactivo conectado a un temporizador de actualización periódica.
- **Telemetría:** Consume datos cada pocos segundos para proyectar en el mapa la latitud, longitud, altitud y velocidad actual de la Estación Espacial Internacional (ISS).

#### F. Autenticación y Seguridad
Se desarrolló un sistema de inicio de sesión y registro de usuarios basado en tokens.
- **Gestión de Estado:** Se utilizó la API `Context` de React (`AuthContext`) para almacenar y distribuir globalmente el estado de autenticación.
- **Bloqueo de Seguridad Progresivo (Lockout):** Se implementó un algoritmo del lado del cliente que detecta tres intentos fallidos consecutivos de login y bloquea la interfaz de envío durante 30 segundos, mitigando ataques locales de fuerza bruta.

---

## 2. ⚙️ Backend & API

El backend constituye el núcleo de la lógica del sistema, gestionando el almacenamiento persistente, sirviendo las simulaciones de datos físicos y actuando como enlace con servicios externos y el microservicio de inferencia de Machine Learning.

### Stack Tecnológico
- **Framework:** FastAPI (Python 3.10+), seleccionado por su alto desempeño asíncrono y la autogeneración de especificaciones interactivas OpenAPI (Swagger).
- **Base de Datos:** PostgreSQL para producción; fallback automático a SQLite local para pruebas y ejecución simplificada.
- **ORM:** SQLAlchemy 2.0 con mapeo declarativo moderno.
- **Seguridad:** Autenticación por medio de tokens JWT firmados mediante el algoritmo HS256 y hashing de contraseñas con Bcrypt.
- **Tasa de Límite (Rate Limiting):** SlowAPI para mitigar posibles ataques de denegación de servicio (DoS) en rutas críticas.

### Implementaciones Destacadas

#### A. Cliente TAP del NASA Exoplanet Archive
Se implementó un cliente HTTP asíncrono que realiza consultas TAP (Table Access Protocol) estructuradas en ADQL (Astronomical Data Query Language). Al iniciar el servidor, si no se encuentra el archivo caché local `kepler_exoplanets.csv` en el disco, se ejecuta una consulta para descargar y persistir de manera local más de 9,500 exoplanetas con sus respectivos identificadores Kepler, períodos, radios y clasificaciones originales.

#### B. Generador Matemático de Curvas de Luz
Se diseñó un algoritmo matemático en el endpoint `/api/exoplanets/{exoplanet_id}/lightcurve` que simula la curva de tránsito fotométrico de un exoplaneta. Se empleó el radio del exoplaneta ($R_p$) y el período orbital para calcular la profundidad del tránsito (proporcional al cociente de áreas $(R_p / R_*)^2$) y la duración del mismo. Además, se le inyectó ruido gaussiano aleatorio realista mediante `random.normalvariate` para simular las perturbaciones presentes en las observaciones espaciales reales.

#### C. Tolerancia a Fallos en la Base de Datos (Mecanismo Fallback)
Se estructuró un sistema de conexión robusto en el gestor de la base de datos. Si el backend no puede conectarse al clúster de PostgreSQL (o si falta la dependencia de conexión `psycopg2` en entornos locales de pruebas rápidas), el sistema redirige automáticamente su configuración de base de datos a un motor de **SQLite en memoria** o local de respaldo (`test.db`). Esto garantizó la portabilidad del código y evitó fallos de ejecución en pipelines de integración continua o pruebas locales rápidas.

### Endpoints Principales del Backend
- `/api/auth/register` & `/api/auth/login`: Registro e inicio de sesión de usuarios con generación de tokens JWT.
- `/api/exoplanets`: Consulta paginada y filtrada del catálogo de exoplanetas Kepler.
- `/api/exoplanets/{exoplanet_id}/lightcurve`: Obtención de los puntos de datos matemáticos de la curva de tránsito de luz.
- `/api/exoplanets/{id}/ml-prediction`: Proxy interno que interactúa con el microservicio de inferencia de ML para clasificar el exoplaneta según sus variables físicas.
- `/api/simulation/bodies`: Cuerpos del sistema solar con parámetros de masa, radio y órbitas reales procedentes de JPL Horizons.
- `/api/iss/position`: Proxy de conexión asíncrona hacia la API externa de Open Notify para consultar la telemetría de la ISS.

---

## 3. 🧠 Machine Learning & Ciencia de Datos

La capa de ciencia de datos dota al proyecto de la capacidad de realizar predicciones inteligentes y simulaciones gravitacionales basadas en principios físicos estrictos.

### Componentes de Ciencia de Datos

#### A. Clasificación Inteligente del Dataset Kepler
Se entrenó y evaluó un clasificador supervisado a partir del conjunto de datos acumulativos de tránsitos Kepler de la NASA.
- **Variables Seleccionadas:** Se consideraron métricas críticas como el período orbital (`koi_period`), el radio planetario (`koi_prad`), la profundidad de tránsito (`koi_depth`), la duración del tránsito (`koi_duration`), y la temperatura de equilibrio (`koi_teq`), entre otras.
- **Modelado:** Se entrenó un clasificador de Bosques Aleatorios (Random Forest) y algoritmos de Gradient Boosting. Se generó un reporte completo de precisión, F1-Score y una matriz de confusión para asegurar la confiabilidad al discriminar falsos positivos (causados comúnmente por sistemas estelares binarios eclipsantes).
- **Notebook de Desarrollo:** Se consolidó el flujo científico completo en el notebook [astralis_e3_fase1_fixed.ipynb](file:///c:/Users/Stef/Documents/GitHub/Astralis_UNAL/astralis_e3_fase1_fixed.ipynb).

#### B. Simulación Gravitatoria N-Cuerpos
Se desarrollaron scripts de integración gravitacional utilizando métodos Runge-Kutta de resolución temporal en el directorio `science/src/` y la biblioteca científica `rebound`. Se modelaron dinámicas orbitales newtonianas para validar matemáticamente la estabilidad orbital de los planetas y contrastar sus períodos contra las leyes físicas.

#### C. Microservicio de Inferencia (`astralis-ml`)
Se aisló la lógica del modelo predictivo en un microservicio independiente construido sobre FastAPI que opera en el puerto `8001`.
- **Inferencia Individual (`POST /predict`):** Recibe las características físicas de un exoplaneta candidato y retorna la clasificación (`CONFIRMED`, `FALSE_POSITIVE`, `CANDIDATE`) junto a su nivel de confianza (`mlConfidence`).
- **Inferencia por Lotes (`POST /predict/batch`):** Permite procesar de manera optimizada hasta 500 registros candidatos en un único request HTTP.
- **Metadatos del Modelo (`GET /model/info`):** Expone las métricas de rendimiento actuales del modelo en producción y los pesos de importancia de cada una de las variables astronómicas.
- **Re-entrenamiento Dinámico (`POST /model/retrain`):** Inicia una tarea en segundo plano (`BackgroundTasks`) que descarga datos frescos desde el NASA Exoplanet Archive empleando ADQL, re-entrena el clasificador y reemplaza el modelo activo en caliente sin interrumpir el microservicio.

---

## 4. ⚙️ DevOps & Infraestructura

El entorno de infraestructura se configuró bajo estándares de reproducibilidad mediante contenedores y orquestación declarativa, garantizando la consistencia del despliegue en entornos locales y de producción.

### Contenerización con Docker
Se diseñó un entorno multi-contenedor coordinado por Docker Compose.
- **Base de Datos (`db`):** Postgres 15 sobre Alpine. Se configuró un `healthcheck` que utiliza la herramienta `pg_isready` para verificar que la base de datos esté lista para recibir conexiones antes de arrancar los microservicios dependientes.
- **Backend (`backend`):** Imagen optimizada construida a partir de `python:3.11-slim`, con montajes de volumen para desarrollo rápido y recarga automática.
- **Frontend (`frontend`):** Se implementó una **compilación multi-etapa (Multi-Stage Build)**:
  - *Etapa 1 (Build):* Descarga dependencias de desarrollo y empaqueta la SPA con Vite en Node.js.
  - *Etapa 2 (Servidor):* Se descarta el entorno de Node y se monta una imagen ligera de **Nginx** en producción que aloja los archivos estáticos compilados en el puerto `80`.

### Orquestación en Kubernetes (`k8s/`)
Se estructuraron manifiestos YAML para el despliegue del ecosistema de microservicios:
- **`secrets.yaml`:** Mapeo de secretos sensibles codificados en Base64 (credenciales de base de datos, URL de conexión SQL y clave de firma de JWT).
- **`configmap.yaml`:** Almacenamiento de variables de entorno globales no sensibles como las URLs internas de resolución inter-servicio.
- **`db.yaml`:** Deployment de PostgreSQL, expuesto internamente en el puerto `5432` como `astralis-db` de tipo `ClusterIP`. Incluye un `PersistentVolumeClaim` (PVC) de `1Gi` que asegura la persistencia de los archivos de base de datos entre reinicios del pod.
- **`ml.yaml`:** Deployment y Service del microservicio `astralis-ml` (puerto 8001), permitiendo la resolución interna DNS mediante el nombre de host `http://astralis-ml:8001`.
- **`backend.yaml`:** Deployment del backend web que inyecta los secretos y variables globales. Expone un servicio interno `ClusterIP` en el puerto `8000`.
- **`frontend.yaml`:** Deployment del servidor web Nginx expuesto hacia el exterior del clúster utilizando un servicio de tipo `LoadBalancer` en el puerto `8080`.

#### Resolución del Reto DNS de Red en Kubernetes
Durante las pruebas de despliegue en Kubernetes, se detectó que el pod del Frontend entraba en estado de fallo continuo (`CrashLoopBackOff`) debido a un error de resolución de Nginx:
```text
[emerg] 1#1: host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:10
```
Nginx valida las URLs definidas en su directiva `proxy_pass` al iniciar. En Docker Compose, el contenedor backend se resolvía usando el nombre del servicio `backend`. Sin embargo, en Kubernetes el servicio se había nombrado originalmente como `astralis-backend`. 

Para resolver este inconveniente, se modificó el archivo `k8s/backend.yaml` renombrando la propiedad `name` del recurso `Service` a `backend` pero manteniendo el selector de coincidencia hacia el Pod etiquetado como `app: astralis-backend`. Esto posibilitó que CoreDNS enlazara el registro DNS interno a la palabra `backend` y que Nginx iniciara exitosamente sin errores.

### Script de Automatización (`deploy.ps1`)
Se codificó un script interactivo en PowerShell que automatiza:
1. El despliegue rápido de desarrollo en Docker Compose (`up --build -d`).
2. El ciclo de vida de despliegue en Kubernetes: detecta si se está empleando Minikube, configura el entorno de compilación, inyecta las imágenes Docker directamente en el clúster, y aplica los manifiestos YAML de forma ordenada (`secrets` -> `configmaps` -> `db` -> `ml` -> `backend` -> `frontend`).

### Integración Continua (CI/CD)
Se estructuró una automatización con GitHub Actions en `.github/workflows/ci.yml`:
- **Trabajo de Backend (`backend-tests`):** Configura Python, instala dependencias, ejecuta análisis estático con `flake8` y corre las pruebas con `pytest` exigiendo un umbral mínimo de cobertura de código del **60%**.
- **Trabajo de Frontend (`frontend-build`):** Ejecuta la compilación estática de Vite y corre linters sobre React.
- **Trabajo de Docker (`docker-build`):** Simula la compilación de los Dockerfiles locales para descartar errores sintácticos en las imágenes de producción.


