# Documentación Técnica — Proyecto Astralis

Este documento consolida la arquitectura, diseño y detalles de implementación del proyecto **Astralis**, una plataforma web de divulgación e investigación astronómica. La documentación está estructurada según las cuatro disciplinas de trabajo que conforman la solución: Frontend, Backend, Machine Learning (Ciencia de Datos) y DevOps.

---

## 1. Frontend & Visualización (E4)

El módulo de Frontend es la capa visual de interacción con el usuario. Traduce datos astronómicos y simulaciones complejas en interfaces dinámicas y comprensibles.

### Arquitectura y Stack Tecnológico
- **Core:** React 18+ con TypeScript para tipado estático seguro.
- **Build Tool:** Vite para compilación y recarga en caliente extremadamente rápidas.
- **Rendering 2D:** HTML5 Canvas API para el simulador orbital, garantizando un alto rendimiento gráfico.
- **Client HTTP:** Axios configurado con interceptores para inyección automática de tokens JWT.
- **Estilos:** Vanilla CSS con variables CSS personalizadas y paletas HSL oscuras de alta fidelidad.

### Componentes y Vistas Principales
1. **Simulador Orbital (Orbital Simulator):**
   - Renderiza el Sol y los 9 cuerpos celestes principales (Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano, Neptuno y Plutón).
   - **Control de Velocidad:** Permite acelerar el tiempo de simulación (1x, 10x, 50x, 100x).
   - **Modos de Escala:**
     - *Escala Visual:* Distribuye las órbitas uniformemente en pantalla para poder observar todos los planetas simultáneamente en un diseño armónico.
     - *Escala Real:* Computa el radio de órbita directamente en función de las Unidades Astronómicas (AU) de cada planeta. Permite apreciar el enorme vacío del sistema solar exterior (requiere zoom y paneo).
   - **Cámara Dinámica:** Implementa gestos interactivos de arrastre (pan) para mover el lienzo y rueda del ratón (zoom) para acercar/alejar la vista hacia la posición del cursor.
   - **Ficha Informativa:** Panel lateral con datos reales (diámetro, período orbital, distancia, lunas y curiosidades) al hacer clic en cualquier planeta.
2. **Catálogo de Exoplanetas:**
   - Presentación de exoplanetas descubiertos por la misión Kepler.
   - Paginación interactiva y filtrado dinámico por clasificación de disposición de la NASA (`CANDIDATE`, `CONFIRMED`, `FALSE_POSITIVE`).
3. **Detalle del Exoplaneta y Curvas de Luz:**
   - Visualización detallada del planeta seleccionado.
   - Generación dinámica de la curva de luz fotométrica para el tránsito del exoplaneta (flujo normalizado frente al tiempo con simulación de ruido realista), permitiendo comprender visualmente el método de detección de tránsitos.
4. **Seguimiento ISS en Tiempo Real (ISS Tracker):**
   - Consulta periódica de la posición actual de la Estación Espacial Internacional (latitud, longitud, altitud y velocidad) con mapa interactivo y telemetría en vivo.

---

## 2. Backend & API (E1)

El Backend es el motor de lógica de negocios y la puerta de enlace para los datos. Expone una API REST robusta que orquesta la persistencia y la comunicación con servicios externos.

### Arquitectura y Stack Tecnológico
- **Framework:** FastAPI (Python 3.10+), elegido por su alto rendimiento asíncrono y auto-generación de especificación OpenAPI (Swagger/ReDoc).
- **Base de Datos:** PostgreSQL para persistencia de datos en producción; fallback dinámico a SQLite en memoria para desarrollo local rápido y pruebas.
- **ORM:** SQLAlchemy 2.0 con mapeo declarativo moderno.
- **Seguridad:** Autenticación por JSON Web Tokens (JWT) firmados con algoritmo HS256 y hashing de contraseñas mediante Bcrypt.
- **Rate Limiting:** SlowAPI (basado en Limits) para protección de endpoints contra ataques de denegación de servicio (DoS).

### Endpoints Principales
- `/api/auth/register` & `/api/auth/login`: Registro e inicio de sesión de usuarios con generación de tokens JWT de sesión segura.
- `/api/exoplanets`: Catálogo paginado de exoplanetas del telescopio Kepler. Cuenta con un cliente HTTP asíncrono que descarga y cachea localmente en formato CSV la base de datos TAP real de la NASA si no se encuentra disponible.
- `/api/exoplanets/{exoplanet_id}/lightcurve`: Generación matemática y aleatorizada de la curva de tránsito lumínico basada en el radio y período del planeta.
- `/api/simulation/bodies`: Cuerpos del sistema solar con masas, radios, posiciones de inicio en AU y velocidades medias reales obtenidos de JPL Horizons.
- `/api/iss/position`: Proxy hacia la API externa de Open Notify para obtener la posición geográfica actual de la ISS.

---

## 3. Ciencia de Datos & Machine Learning (E3)

La capa científica del proyecto proporciona los modelos predictivos y las simulaciones físicas rigurosas que fundamentan los datos de la plataforma.

### Áreas de Trabajo
1. **Clasificación Inteligente de Candidatos (Machine Learning):**
   - **Algoritmo:** Modelo clasificador entrenado con el dataset acumulativo de la misión espacial Kepler de la NASA.
   - **Objetivo:** Predecir si un objeto de interés Kepler (KOI) es un exoplaneta real (`CONFIRMED`) o una falsa alarma instrumental (`FALSE_POSITIVE`), asignando una puntuación de confianza de clasificación (`mlConfidence`).
   - **Métricas:** Evaluación del modelo documentando precisión global (accuracy), métrica F1-score, y análisis detallado mediante matriz de confusión.
2. **Simulaciones Físicas de Órbitas (N-Cuerpos):**
   - Implementaciones matemáticas en Jupyter Notebooks utilizando la librería `rebound` para simular dinámicamente la estabilidad gravitatoria de sistemas planetarios complejos a lo largo del tiempo basándose en la Ley de Gravitación Universal.
3. **Integración e Ingreso de Datos Astronómicos (TAP Client):**
   - Automatización de la conexión con el NASA Exoplanet Archive a través de consultas Table Access Protocol (TAP) expresadas en ADQL (Astronomical Data Query Language) para obtener los registros actualizados de tránsitos Kepler en tiempo real.

---

## 4. DevOps & Infraestructura (E2)

El área de DevOps asegura que el software sea construible, testeable y desplegable de forma continua mediante configuraciones estandarizadas en contenedores y pipelines de integración.

### Contenerización con Docker
El proyecto está completamente dockerizado y orquestado mediante Docker Compose para facilitar un entorno multi-contenedor idéntico entre desarrollo y producción.

1. **Servicio Database (`db`):**
   - Imagen oficial `postgres:15-alpine`.
   - Healthcheck para verificar el estado de Postgres antes de arrancar los servicios dependientes.
   - Persistencia de datos mediante volumen de Docker indexado.
2. **Servicio Backend (`backend`):**
   - Construcción optimizada multi-etapa basada en `python:3.11-slim`.
   - Montaje de volúmenes de desarrollo para recarga automática de código.
3. **Servicio Frontend (`frontend`):**
   - Proceso de construcción multi-etapa (Multi-Stage Build):
     - **Etapa 1:** Entorno Node.js para compilar e inicializar el empaquetado de producción de la SPA de React.
     - **Etapa 2:** Imagen ultraligera de Nginx que sirve los archivos estáticos e implementa un proxy inverso para enrutar de forma transparente todas las peticiones `/api/*` al puerto del backend.

### Orquestación con Kubernetes
Para desplegar la aplicación a gran escala en producción, se ha estructurado un conjunto de manifiestos declarativos de Kubernetes en el directorio `k8s/`:
- **`secrets.yaml`:** Manejo seguro de credenciales cifradas en Base64 (usuario y contraseña de la BD, URL de la base de datos y llaves secretas JWT).
- **`configmap.yaml`:** Configuración de variables de entorno no sensibles (URLs de backend y frontend, puertos, y la URL de resolución interna para el servicio ML).
- **`db.yaml`:** Declara un `PersistentVolumeClaim` (PVC) de 1Gi para garantizar la persistencia de PostgreSQL al reiniciar pods, junto al `Deployment` de Postgres y un `Service` interno expuesto en el puerto 5432.
- **`ml.yaml`:** Deployment y Service ClusterIP (puerto 8001) para el microservicio de Machine Learning (`astralis-ml`), resolviendo predicciones en base a un clasificador Random Forest.
- **`backend.yaml`:** Deployment del backend escalable de manera horizontal e inyección de secretos/configuraciones, expuesto internamente mediante un Service ClusterIP en el puerto 8000.
- **`frontend.yaml`:** Deployment de la interfaz de Nginx expuesta hacia el exterior mediante un Service tipo `LoadBalancer` en el puerto 8080.

### Script de Despliegue Interactivo (`deploy.ps1`)
Para simplificar la administración y el ciclo de vida del desarrollo local y de staging, se ha implementado un script interactivo en PowerShell (`deploy.ps1`) que:
1. Automatiza el ciclo completo de Docker Compose (`down` -> `up --build -d`), compilando imágenes locales y exponiendo el puerto `8080`.
2. Verifica dependencias locales de Kubernetes (`kubectl` y clúster activo), compila las imágenes Docker del frontend, backend y el microservicio de ML, carga las imágenes en el clúster si se usa Minikube, y aplica todos los manifiestos (`secrets`, `configmaps`, `db`, `ml`, `backend` y `frontend`) en orden jerárquico.

### Pipeline de Integración Continua (CI/CD)
El proyecto utiliza GitHub Actions para automatizar las pruebas y garantizar la calidad en cada integración:
- **Triggers:** Ejecución en cada `push` o `pull_request` sobre la rama `main`.
- **Trabajos (Jobs):**
  - **`backend-tests`:** Configura Python, instala dependencias, ejecuta análisis de estilo (linter `flake8`) y corre los tests unitarios con `pytest`, asegurando que la cobertura de código (coverage) sea de mínimo el 60%.
  - **`frontend-build`:** Configura Node, instala dependencias con `npm ci`, corre el formateador/linter y compila la build de producción de Vite.
  - **`docker-build`:** Valida que las imágenes de Docker de Frontend y Backend se puedan compilar correctamente a partir de sus respectivos Dockerfiles.
  - **`deploy-staging`:** Pipeline placeholder para desplegar automáticamente a un entorno de pruebas una vez que las imágenes Docker han sido validadas.
