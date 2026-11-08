from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from services.processor.app.api import health, voices, documents, conversions
from services.processor.app.config import settings
from services.processor.app.core.exceptions import ProcessingBaseException
from services.processor.app.core.logger import logger
from services.processor.app.database.models import Base
from services.processor.app.database.session import engine

app = FastAPI(
    title="Commercial PDF-to-Audio Processing API",
    description="High-performance backend API for PDF text extraction, OCR, neural TTS chunking, and FFmpeg audio assembly.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(ProcessingBaseException)
async def processing_exception_handler(request: Request, exc: ProcessingBaseException):
    logger.error(f"Processing error: {exc.message} (Path: {request.url.path})")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.on_event("startup")
def on_startup():
    logger.info(f"Starting {settings.APP_NAME} in [{settings.ENVIRONMENT}] mode.")
    try:
        # Create database tables if not existing
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema synchronized.")
    except Exception as e:
        logger.warning(f"Database sync warning on startup: {e}")


# Register API Routers
app.include_router(health.router)
app.include_router(health.router, prefix="")
app.include_router(voices.router)
app.include_router(documents.router)
app.include_router(conversions.router)


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "docs": "/docs",
        "health": "/api/health",
        "ready": "/api/health/ready",
    }

