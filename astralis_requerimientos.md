# Documento de Requerimientos — Proyecto Astralis

> **Versión:** 1.0  
> **Fecha:** 2026-05-06  
> **Equipo:** E1 (Backend) · E2 (DevOps) · E3 (Data Science) · E4 (Frontend)

---

## Introducción

**Astralis** es una plataforma web de divulgación e investigación astronómica que integra simulación orbital, machine learning y visualización interactiva para explorar el universo. El proyecto nace como una iniciativa académica orientada a construir un sistema de producción real, conectando datos científicos públicos (JPL Horizons, NASA Exoplanet Archive, Open Notify) con una arquitectura moderna de microservicios.

El sistema está organizado en cuatro módulos interdependientes:

- **E1 — Backend & API:** Expone la lógica de negocio y orquesta la comunicación entre los demás módulos mediante una API REST documentada.
- **E2 — DevOps & Infraestructura:** Garantiza que el sistema se construya, pruebe y despliegue de forma automatizada y confiable.
- **E3 — Ciencia de Datos:** Proporciona el núcleo científico: simulación N-cuerpos, clasificación de exoplanetas con ML y datos en tiempo real.
- **E4 — Frontend & Visualización:** Es la interfaz con el usuario, donde la ciencia se traduce en experiencias visuales 2D/3D.

Este documento consolida los **requerimientos funcionales** (lo que el sistema debe hacer) y los **requerimientos no funcionales** (las restricciones de calidad bajo las cuales debe operar), extraídos directamente del documento base del proyecto. Cada requerimiento incluye su identificador, descripción, módulo responsable y la justificación documental que lo sustenta.

---

## 1. Requerimientos Funcionales

> *Lo que el sistema debe **hacer** — comportamientos observables por el usuario o por otros módulos.*

| ID | Requerimiento | Descripción y justificación | Módulo |
|:---|:--------------|:----------------------------|:-------|
| **RF-01** | **Autenticación de usuarios** | El sistema debe permitir registro, login y gestión de sesiones mediante JWT y OAuth2. <br><br>▸ *El doc dice explícitamente: "autenticación JWT, OAuth2" como parte del contrato de E1. Sin auth, ningún endpoint de la API es seguro.* | E1 |
| **RF-02** | **API REST con endpoints documentados** | La API debe exponer mínimo 6 endpoints con contratos bien definidos, documentados en Swagger/OpenAPI. <br><br>▸ *"API REST funcional con al menos 6 endpoints" (Fase 2, E1). Swagger es obligatorio en Fase 3. Es el contrato que consumen E3 y E4.* | E1 |
| **RF-03** | **Simulador orbital N-cuerpos** | El sistema debe simular físicamente la órbita de cuerpos celestes usando datos reales del JPL Horizons System. <br><br>▸ *"Prototipo de simulación N-cuerpos en Jupyter Notebook" (Fase 1, E3). "Simulador N-cuerpos expuesto como módulo que la API puede llamar" (Fase 2). Es uno de los dos pilares científicos del proyecto.* | E3 |
| **RF-04** | **Clasificación ML de exoplanetas** | El sistema debe clasificar candidatos a exoplanetas (confirmado vs. falso positivo) usando un modelo entrenado con datos del telescopio Kepler. <br><br>▸ *"Modelo ML entrenado y evaluado — clasificación de exoplanetas" (Fase 2, E3). El dataset es el NASA Exoplanet Archive con más de 9.000 candidatos. Es el caso de uso de ML central.* | E3 |
| **RF-05** | **Visualización del simulador orbital** | La interfaz debe mostrar el simulador orbital 2D animado con movimiento real de los cuerpos celestes. <br><br>▸ *"Simulador orbital 2D animado" es el primer entregable visual de E4 en Fase 2. En Fase 3 escala a 3D con Three.js.* | E4 |
| **RF-06** | **Catálogo de exoplanetas con filtros** | El frontend debe presentar un catálogo navegable de exoplanetas con capacidad de filtrado por atributos. <br><br>▸ *"Catálogo de exoplanetas con filtros" (Fase 2, E4). El catálogo consume directamente el modelo de E3 vía la API de E1 — si uno falla, el catálogo falla.* | E4 |
| **RF-07** | **Curvas de luz de tránsito** | El sistema debe visualizar las curvas de luz fotométrica que permiten detectar exoplanetas por el método de tránsito. <br><br>▸ *"Visualización de curvas de luz de tránsito" (Fase 2, E4). Es la evidencia observacional que alimenta el modelo ML — conecta directamente RF-04 con la interfaz.* | E4 |
| **RF-08** | **Visualización 3D del sistema solar** | En la fase final, el frontend debe renderizar el sistema solar en 3D usando Three.js. <br><br>▸ *"Visualización 3D del sistema solar con Three.js" (Fase 3, E4). Three.js ya está en el stack sugerido de E4. Es el módulo más visible en el demo day.* | E4 |
| **RF-09** | **Pipeline CI/CD automatizado** | El sistema debe tener un pipeline que ejecute lint → tests → build → deploy automáticamente en cada merge a main. <br><br>▸ *"Pipeline CI/CD completo: lint → tests → build → deploy automático a staging en cada merge a main" (Fase 2, E2). Sin esto "el sistema solo existe en los computadores del equipo".* | E2 |
| **RF-10** | **Modelo ML expuesto como microservicio** | El modelo de clasificación debe estar disponible como microservicio independiente con versionado y métricas documentadas. <br><br>▸ *"Modelo servido como microservicio independiente con versionado. Métricas documentadas: accuracy, F1, matriz de confusión" (Fase 3, E3). La API de E1 lo consume — debe ser un servicio estable.* | E3 |
| **RF-11** | **Datos de posición ISS en tiempo real** | El sistema debe mostrar la posición de la ISS actualizada en tiempo real usando la Open Notify API. <br><br>▸ *"Posición de la ISS actualizada cada segundo. Perfecto para el demo en vivo" (sección de datos). Está explícitamente señalado para usarse durante el demo day.* | E3, E4 |

---

## 2. Requerimientos No Funcionales

> *Las restricciones de calidad — cómo debe comportarse el sistema, no qué debe hacer.*

| ID | Categoría | Requerimiento | Justificación |
|:---|:----------|:--------------|:--------------|
| **RNF-01** | **Seguridad** | **Cumplimiento OWASP Top 10** | "Validaciones básicas contra OWASP Top 10" (Fase 2). En Fase 3: "Auditoría OWASP Top 10. Rate limiting, sanitización de inputs, headers de seguridad". El hacking ético cruzado de la Fase 3 lo evalúa directamente. |
| **RNF-02** | **Confiabilidad** | **Cobertura de tests ≥ 60%** | "Cobertura de tests mínima del 60%" (Fase 2, E2, sección Calidad). Es un umbral numérico explícito — no es sugerencia. Se valida con el pipeline en vivo durante el parcial. |
| **RNF-03** | **Disponibilidad** | **Monitoreo activo con alertas** | "Monitoreo activo con alertas. Logs centralizados" (Fase 3, E2). Stack: UptimeRobot + Grafana Cloud. Si el sistema cae en el demo, el postmortem hace parte de la nota — el monitoreo debe detectarlo. |
| **RNF-04** | **Rendimiento** | **Tests de carga con k6/Locust** | "Tests de integración y carga con k6 o Locust" (Fase 4, E1). El doc menciona escalabilidad como una de las preocupaciones de producción del sistema, al nivel de Rappi o Bancolombia. |
| **RNF-05** | **Usabilidad** | **UX responsive** | "UX responsive" (Fase 3, E4). El sistema debe funcionar en distintos tamaños de pantalla, especialmente en el demo day donde podría usarse en un proyector o tablet. |
| **RNF-06** | **Mantenibilidad** | **Ramas protegidas y reglas de PR** | "Repositorio monorepo en GitHub con ramas protegidas, reglas de PR" (Fase 1, E2). La arquitectura de ramas impide que código sin revisar llegue a main — fundamental en un equipo de 4 donde todos dependen de la misma base. |
| **RNF-07** | **Exactitud** | **Métricas ML documentadas (F1, accuracy, sesgo)** | "Métricas documentadas: accuracy, F1, matriz de confusión. Análisis de sesgos del dataset" (Fase 3, E3). El doc señala que clasificar mal un objeto potencialmente peligroso tiene implicaciones éticas reales — la exactitud no es opcional. |
| **RNF-08** | **Trazabilidad** | **Logs centralizados y runbook del pipeline** | "Logs centralizados. Runbook del pipeline documentado" (Fase 3, E2). Si el sistema cae y no hay logs, el postmortem es imposible. El runbook documenta cómo reproducir el despliegue. |
| **RNF-09** | **Ética** | **Reflexión ética del modelo ML** | "¿Qué implicaciones tiene que el modelo clasifique mal un objeto potencialmente peligroso? ¿Cómo se mitiga?" (Fase 4, E3). Es un entregable formal, no una reflexión opcional — el doc lo trata al nivel de cualquier otro entregable técnico. |
| **RNF-10** | **Portabilidad** | **Despliegue en la nube con Docker** | "Deploy a producción confirmado" con Docker + Railway/Render/Fly.io (E2). El README debe tener instrucciones de instalación local. El sistema debe correr igual en la nube que en el PC del equipo. |
| **RNF-11** | **Interoperabilidad** | **Integración entre los 4 módulos** | "Si el backend cae, el frontend no funciona. Si el pipeline falla, nadie despliega." El sistema es explícitamente interdependiente. La integración end-to-end es obligatoria desde Fase 2 con un demo funcional. |

---

## Glosario de Módulos

| Módulo | Nombre | Responsabilidad |
|:-------|:-------|:----------------|
| **E1** | Backend & API | Autenticación, endpoints REST, orquestación de servicios |
| **E2** | DevOps & Infraestructura | CI/CD, monitoreo, despliegue, calidad del código |
| **E3** | Ciencia de Datos | Simulación orbital, ML, datos astronómicos |
| **E4** | Frontend & Visualización | Interfaces de usuario, gráficos 2D/3D, catálogos |
| **SYS** | Sistema | Requerimientos transversales a todos los módulos |

---

*Documento generado a partir del archivo fuente `astralis_requerimientos.html`.*
