from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from services.processor.app.config import settings
from services.processor.app.core.logger import logger

# Convert postgres:// to postgresql+psycopg2:// for SQLAlchemy
db_url = settings.DATABASE_URL.split("?schema=")[0]
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# SQLite fallback support for local unit tests if PostgreSQL is not active
is_sqlite = db_url.startswith("sqlite")

try:
    if is_sqlite:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
except Exception as e:
    logger.warning(f"Could not connect to database URL ({db_url}): {e}. Initializing in-memory fallback for testing.")
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI and Celery database session dependency."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
