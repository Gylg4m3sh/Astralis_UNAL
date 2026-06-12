# Guion de Exposición — DevOps y Kubernetes (Astralis)

Este documento contiene el guion y el sustento técnico para la sustentación del despliegue, contenerización y orquestación del proyecto **Astralis**. Su duración estimada es de **3 minutos y medio**.

---

## 1. Introducción y Arquitectura de Contenedores (0:00 - 1:00)

> **Qué decir:**
> *"Buenas. Para el despliegue e infraestructura del proyecto **Astralis**, implementamos una arquitectura de microservicios contenerizados y desacoplados. Diseñamos la solución tanto para desarrollo rápido con **Docker Compose** como para producción con **Kubernetes**.
> 
> El sistema consta de 4 servicios: Base de datos PostgreSQL, API de Backend en FastAPI, Frontend en React, y un microservicio independiente de Machine Learning también en FastAPI.
> 
> Para el frontend, aplicamos un **Multi-Stage Build** en el Dockerfile: usamos Node para compilar la aplicación y luego transferimos únicamente los archivos estáticos a un servidor web **Nginx** optimizado. Esto redujo el tamaño de la imagen final de 1 gigabyte a menos de 50 megabytes. Además, configuramos `healthchecks` para asegurar que el backend espere a que la base de datos esté lista antes de arrancar."*

### Sustento Técnico / Cómo se hizo:
* **Docker multi-stage:** Minimiza la superficie de ataque y el almacenamiento al descartar dependencias de desarrollo (`node_modules`) y compilar la SPA para ser servida directamente por Nginx en producción.
* **Orquestación en desarrollo:** Uso de `depends_on` con la condición `service_healthy` sobre PostgreSQL (utilizando la utilidad `pg_isready -U user -d astralis`).

---

## 2. Orquestación y Red en Kubernetes (1:00 - 2:00)

> **Qué decir:**
> *"Al portar la aplicación a **Kubernetes**, organizamos la infraestructura en archivos YAML declarativos bajo tres conceptos clave: seguridad, persistencia y enrutamiento. 
> 
> Usamos **Secrets** para credenciales de base de datos y llaves JWT, y **ConfigMaps** para variables de entorno como la URL del microservicio de ML. 
> La persistencia de PostgreSQL la aseguramos mediante un **PersistentVolumeClaim** de 1 gigabyte para evitar pérdida de datos si el pod se reinicia.
> 
> Para la red, aislamos los servicios internos (Backend, Base de Datos y Machine Learning) usando servicios tipo **ClusterIP** que no se exponen a internet. Solo el Frontend se configuró como un servicio tipo **LoadBalancer** en el puerto 8080 para actuar como puerta de acceso pública al clúster."*

### Sustento Técnico / Cómo se hizo:
* **`secrets.yaml` / `configmap.yaml`:** Mapean variables de entorno de forma segura e independiente al código fuente.
* **`PersistentVolumeClaim` (PVC):** Vinculado dinámicamente o por paths locales al Pod de Postgres para persistir la ruta `/var/lib/postgresql/data`.
* **Red del Clúster:** Aislamiento de red mediante servicios `ClusterIP` que evitan tráfico público directo. CoreDNS de Kubernetes resuelve los hostnames (`http://astralis-ml:8001` y `http://backend:8000`) internamente de forma automática.

---

## 3. Reto Técnico y Solución DNS (2:00 - 2:50)

> **Qué decir:**
> *"El mayor reto técnico ocurrió en Kubernetes cuando el pod del Frontend empezó a fallar en bucle (`CrashLoopBackOff`). Diagnosticamos que Nginx no iniciaba porque intentaba resolver el host `backend` en su proxy inverso, pero el servicio en K8s se llamaba originalmente `astralis-backend`. 
> 
> Lo solucionamos renombrando el `Service` de Kubernetes a `backend` pero manteniendo la etiqueta `app: astralis-backend` para el pod. Así, CoreDNS de Kubernetes resolvió el dominio interno perfectamente sin alterar las etiquetas lógicas del deployment."*

### Sustento Técnico / Cómo se hizo:
* **Nginx upstream resolving:** Por defecto, Nginx valida todas las directivas `proxy_pass` en su arranque. Si CoreDNS no puede resolver el hostname configurado (`backend`), el binario de Nginx termina de forma abrupta, resultando en un contenedor en fallo.
* **Desacoplamiento de etiquetas:** Se renombró el `Service` a `name: backend` manteniendo el selector hacia el Pod con etiqueta `app: astralis-backend` en `k8s/backend.yaml`.

---

## 4. Automatización y CI/CD (2:50 - 3:30)

> **Qué decir:**
> *"Por último, automatizamos la operación del clúster con un script interactivo en PowerShell (`deploy.ps1`) que compila las imágenes, las inyecta en el daemon de **Minikube** y aplica los manifiestos en orden jerárquico. 
> 
> Todo el flujo está protegido por un pipeline de **GitHub Actions** en CI/CD que, ante cada cambio, valida el estilo del código, corre las pruebas de integración en Python exigiendo una cobertura mínima del 60% y comprueba la construcción de los Dockerfiles antes de permitir la integración a la rama principal. Con esto aseguramos un entorno robusto, automatizado y escalable."*

### Sustento Técnico / Cómo se hizo:
* **Script de despliegue (`deploy.ps1`):** Automatiza la detección del contexto activo de Kubernetes y compila/carga imágenes dinámicamente (`minikube image load`).
* **CI/CD (`.github/workflows/ci.yml`):** Ejecuta trabajos paralelos para formateo, tests de backend (`pytest` + `coverage`), chequeos de frontend, y validación sintáctica de archivos Dockerfile (`docker build`).
