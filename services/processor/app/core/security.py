import hashlib
from fastapi import Header, HTTPException, status, Security
from fastapi.security import APIKeyHeader
from services.processor.app.config import settings

API_KEY_HEADER = APIKeyHeader(name="X-Internal-API-Key", auto_error=False)

def verify_internal_api_key(
    api_key: str = Security(API_KEY_HEADER),
) -> bool:
    """Validate internal service-to-service requests between Next.js and FastAPI."""
    if not api_key or api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return True

def compute_file_sha256(file_path: str, chunk_size: int = 65536) -> str:
    """Calculate cryptographic SHA-256 hash of a file for integrity and deduplication."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
    return hasher.hexdigest()

