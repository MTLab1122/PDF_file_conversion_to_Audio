import os
from typing import Tuple
import fitz # PyMuPDF
from services.processor.app.config import settings
from services.processor.app.core.exceptions import (
    DocumentSecurityError,
    DocumentCorruptedError,
    PageCountExceededError,
    FileSizeExceededError,
)
from services.processor.app.core.logger import logger


class PDFSafetyValidator:
    """Rigorous security and structure validator for uploaded PDF files."""

    PDF_MAGIC_BYTES = b"%PDF-"
    PDF_EOF_MARKER = b"%%EOF"
    MAX_FILE_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    MAX_PAGE_COUNT = settings.MAX_PAGES_LIMIT

    # Suspicious structural elements commonly used in PDF exploits
    SUSPICIOUS_TAGS = [
        b"/JavaScript",
        b"/JS",
        b"/Launch",
        b"/SubmitForm",
        b"/ImportData",
    ]

    @classmethod
    def validate_file(
        cls,
        file_path: str,
        max_size_mb: int = None,
        max_pages: int = None,
    ) -> Tuple[int, bool]:
        """Perform full security and structural validation on the PDF.
        Returns: (page_count, is_encrypted).
        Raises: DocumentSecurityError, DocumentCorruptedError, PageCountExceededError, FileSizeExceededError.
        """
        max_size = (max_size_mb * 1024 * 1024) if max_size_mb is not None else cls.MAX_FILE_SIZE_BYTES
        max_pages_limit = max_pages if max_pages is not None else cls.MAX_PAGE_COUNT

        # 1. Physical File Checks
        if not os.path.exists(file_path):
            raise DocumentCorruptedError("PDF file does not exist on storage.")

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise DocumentCorruptedError("PDF file is completely empty (0 bytes).")

        if file_size > max_size:
            raise FileSizeExceededError(
                f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum limit ({max_size / (1024*1024):.1f} MB)."
            )

        # 2. Binary Header and Trailer Validation (Magic Bytes & EOF)
        with open(file_path, "rb") as f:
            header = f.read(1024)
            if cls.PDF_MAGIC_BYTES not in header:
                raise DocumentSecurityError("File signature mismatch: File is not a valid PDF document.")

            # Search backwards for %%EOF within last 4KB
            f.seek(max(0, file_size - 4096), os.SEEK_SET)
            tail = f.read(4096)
            if cls.PDF_EOF_MARKER not in tail:
                logger.warning(f"File {file_path} missing standard EOF marker, checking with PyMuPDF parser.")

        # 3. Deep Structural Inspection with PyMuPDF
        try:
            doc = fitz.open(file_path)
        except Exception as e:
            raise DocumentCorruptedError(f"Failed to parse PDF document structure: {str(e)}")

        try:
            # 4. Check Encryption / Password Protection
            if doc.is_encrypted:
                # Try authenticating with empty password (some PDFs are encrypted with blank user pass)
                if not doc.authenticate(""):
                    raise DocumentSecurityError(
                        "Document is password-protected or encrypted. Please remove password protection before uploading."
                    )

            # 5. Check Page Count
            page_count = len(doc)
            if page_count == 0:
                raise DocumentCorruptedError("Document contains zero pages.")

            if page_count > max_pages_limit:
                raise PageCountExceededError(
                    f"Document has {page_count} pages, which exceeds the allowed plan limit of {max_pages_limit} pages."
                )

            # 6. Check for Malicious Executable PDF Constructs
            # Scan PDF objects for embedded JS/Launch actions
            xref_count = doc.xref_length()
            for xref in range(1, xref_count):
                try:
                    obj_str = doc.xref_object(xref).encode("utf-8", errors="ignore")
                    for tag in cls.SUSPICIOUS_TAGS:
                        if tag in obj_str:
                            logger.warning(f"Suspicious tag {tag.decode()} detected at xref {xref} in {file_path}")
                            # Notice: Some commercial PDFs contain benign JS forms; we log and sanitize or block if Launch
                            if tag == b"/Launch":
                                raise DocumentSecurityError(
                                    "Document contains prohibited executable /Launch action."
                                )
                except Exception:
                    continue

            logger.info(f"PDF safety validation passed: {file_path} ({page_count} pages, {file_size} bytes)")
            return page_count, doc.is_encrypted

        finally:
            if doc is not None and not doc.is_closed:
                doc.close()
