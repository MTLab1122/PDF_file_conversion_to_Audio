import pytest
from services.processor.app.extraction.pdf_safety import PDFSafetyValidator
from services.processor.app.core.exceptions import (
    DocumentSecurityError,
    DocumentCorruptedError,
    PageCountExceededError,
)

def test_validate_valid_digital_pdf(sample_digital_pdf):
    page_count, is_encrypted = PDFSafetyValidator.validate_file(sample_digital_pdf)
    assert page_count == 1
    assert is_encrypted is False

def test_reject_corrupted_pdf_header(sample_corrupt_pdf):
    with pytest.raises(DocumentSecurityError) as exc_info:
        PDFSafetyValidator.validate_file(sample_corrupt_pdf)
    assert "File signature mismatch" in str(exc_info.value)

def test_reject_empty_zero_byte_file(tmp_path):
    empty_file = tmp_path / "zero_bytes.pdf"
    empty_file.write_bytes(b"")
    with pytest.raises(DocumentCorruptedError):
        PDFSafetyValidator.validate_file(str(empty_file))

def test_enforce_page_count_limit(sample_digital_pdf):
    with pytest.raises(PageCountExceededError) as exc_info:
        PDFSafetyValidator.validate_file(sample_digital_pdf, max_pages=0)
    assert "exceeds the allowed plan limit" in str(exc_info.value)

