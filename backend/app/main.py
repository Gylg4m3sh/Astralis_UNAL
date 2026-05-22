from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Astralis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def index():
    return {
        "status": "ok",
        "api": "Astralis Backend",
        "msg": "API de backend corriendo"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
