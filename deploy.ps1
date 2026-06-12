# Script de despliegue interactivo para Astralis
# Soporta despliegues en Docker Compose y Kubernetes (K8s)

Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "       ASTRALIS DEPLOYMENT UTILITY       " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Selecciona el entorno de despliegue:"
Write-Host "1) Docker Compose (Entorno multi-contenedor local rápido)"
Write-Host "2) Kubernetes (Entorno orquestado escalable local/nube)"
Write-Host "Q) Cancelar"
Write-Host ""

$choice = Read-Host "Ingresa tu opción (1, 2 o Q)"

if ($choice -eq "1") {
    Write-Host "`n[Docker Compose] Iniciando despliegue..." -ForegroundColor Green
    
    Write-Host "-> Deteniendo contenedores antiguos..." -ForegroundColor Gray
    docker-compose down
    
    Write-Host "-> Compilando y levantando contenedores en background..." -ForegroundColor Gray
    docker-compose up --build -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[Docker Compose] ¡Despliegue completado con éxito!" -ForegroundColor Green
        Write-Host "Accede a la plataforma en: http://localhost:8080" -ForegroundColor Yellow
    } else {
        Write-Error "Ocurrió un error al compilar o levantar Docker Compose."
    }
}
elseif ($choice -eq "2") {
    Write-Host "`n[Kubernetes] Iniciando despliegue..." -ForegroundColor Green
    
    # Verificar si kubectl está instalado
    $kubectlCheck = Get-Command kubectl -ErrorAction SilentlyContinue
    if (-not $kubectlCheck) {
        Write-Error "kubectl no está instalado o no se encuentra en el PATH del sistema."
        exit
    }
    
    # Verificar si el clúster es accesible
    Write-Host "-> Verificando conexión al clúster de Kubernetes..." -ForegroundColor Gray
    $clusterInfo = kubectl cluster-info
    if ($LASTEXITCODE -ne 0) {
        Write-Error "No se puede conectar al clúster de Kubernetes. ¿Minikube o Docker Desktop Kubernetes están corriendo?"
        exit
    }

    # Si se detecta Minikube, sugerir configurar el entorno Docker
    $minikubeCheck = kubectl config current-context
    if ($minikubeCheck -eq "minikube") {
        Write-Host "-> Clúster Minikube detectado." -ForegroundColor Yellow
        Write-Host "-> Sugerencia: Si las imágenes no cargan, ejecuta 'minikube image load' o configura el shell con 'minikube docker-env'" -ForegroundColor Yellow
    }

    Write-Host "-> Compilando imágenes Docker locales..." -ForegroundColor Gray
    docker build -t astralis-backend:latest ./backend
    docker build -t astralis-frontend:latest ./frontend

    # Si es minikube, cargar las imágenes dentro del clúster
    if ($minikubeCheck -eq "minikube") {
        Write-Host "-> Cargando imágenes dentro de Minikube..." -ForegroundColor Gray
        minikube image load astralis-backend:latest
        minikube image load astralis-frontend:latest
    }

    Write-Host "-> Aplicando secretos y configuraciones..." -ForegroundColor Gray
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/configmap.yaml

    Write-Host "-> Desplegando Base de Datos PostgreSQL..." -ForegroundColor Gray
    kubectl apply -f k8s/db.yaml

    Write-Host "-> Desplegando Backend API..." -ForegroundColor Gray
    kubectl apply -f k8s/backend.yaml

    Write-Host "-> Desplegando Frontend..." -ForegroundColor Gray
    kubectl apply -f k8s/frontend.yaml

    Write-Host "`n[Kubernetes] ¡Manifiestos aplicados con éxito!" -ForegroundColor Green
    Write-Host "Para verificar el estado de los Pods ejecuta: kubectl get pods" -ForegroundColor Yellow
    
    if ($minikubeCheck -eq "minikube") {
        Write-Host "Para abrir la web en Minikube ejecuta: minikube service astralis-frontend" -ForegroundColor Yellow
    } else {
        Write-Host "Accede a la plataforma en: http://localhost:8080 (si usas Docker Desktop LoadBalancer)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "`nDespliegue cancelado." -ForegroundColor Yellow
}
