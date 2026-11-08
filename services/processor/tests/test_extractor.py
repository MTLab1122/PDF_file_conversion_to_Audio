import pytest
from services.processor.app.extraction.extractor import PDFExtractor

def test_extract_document_reading_order_and_content(sample_digital_pdf):
    pages = PDFExtractor.extract_document(sample_digital_pdf)
    assert len(pages) == 1
    page = pages[0]
    assert page.page_number == 1
    assert "Commercial Audio Synthesis" in page.text
    assert "converts PDF documents into high-quality MP3 audio files" in page.text
    assert page.needs_ocr is False
    assert page.char_count > 100

def test_extract_empty_pdf_flags_needs_ocr(sample_empty_pdf):
    pages = PDFExtractor.extract_document(sample_empty_pdf)
    assert len(pages) == 1
    page = pages[0]
    # Blank page has < 40 chars, so needs_ocr should be True
    assert page.needs_ocr is True
    assert page.char_count == 0

