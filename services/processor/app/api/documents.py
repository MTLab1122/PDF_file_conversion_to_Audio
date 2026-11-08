from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from services.processor.app.core.security import verify_internal_api_key
from services.processor.app.extraction.pdf_safety import PDFSafetyValidator
from services.processor.app.extraction.extractor import PDFExtractor
from services.processor.app.preprocessing.cleaner import TextCleaner
from services.processor.app.chunking.chunker import text_chunker

router = APIRouter(prefix="/api/documents", tags=["Documents"])


class ValidateRequest(BaseModel):
    file_path: str
    max_size_mb: int = 50
    max_pages: int = 500


class ExtractPreviewRequest(BaseModel):
    file_path: str
    target_chunk_size: int = 1000


@router.post("/validate", dependencies=[Depends(verify_internal_api_key)])
def validate_document(req: ValidateRequest):
    """Internal validation of uploaded PDF document structure and security."""
    try:
        page_count, is_encrypted = PDFSafetyValidator.validate_file(
            req.file_path,
            max_size_mb=req.max_size_mb,
            max_pages=req.max_pages,
        )
        return {
            "valid": True,
            "page_count": page_count,
            "is_encrypted": is_encrypted,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/extract-preview", dependencies=[Depends(verify_internal_api_key)])
def extract_preview(req: ExtractPreviewRequest):
    """Extract sample text and chunk estimates for frontend conversion preview."""
    try:
        pages = PDFExtractor.extract_document(req.file_path)
        combined = "\n\n".join(p.text for p in pages if p.text.strip())
        cleaned = TextCleaner.clean(combined)
        chunks = text_chunker.chunk_document(cleaned)

        return {
            "total_pages": len(pages),
            "pages_needing_ocr": sum(1 for p in pages if p.needs_ocr),
            "total_characters": len(cleaned),
            "estimated_chunks": len(chunks),
            "preview_sample": cleaned[:600] + ("..." if len(cleaned) > 600 else ""),
            "chunks_sample": [c.to_dict() for c in chunks[:3]],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

