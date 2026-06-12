FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias primero (cacheable)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Crear directorio de modelos (se puebla en el primer arranque)
RUN mkdir -p models

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
