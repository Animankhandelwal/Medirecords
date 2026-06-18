from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.api import auth, documents, medical_data, assistant, report_generator
import app.models  # noqa: F401 — ensures all models are registered before create_all

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Medical Records API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(medical_data.router)
app.include_router(assistant.router)
app.include_router(report_generator.router)


@app.get("/health")
def health():
    return {"status": "ok"}