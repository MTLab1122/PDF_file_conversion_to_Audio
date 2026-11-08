import os
import pytest
import fitz # PyMuPDF

@pytest.fixture(scope="session")
def fixtures_dir(tmp_path_factory):
    dir_path = tmp_path_factory.mktemp("pdf_fixtures")
    return str(dir_path)

@pytest.fixture(scope="session")
def sample_digital_pdf(fixtures_dir):
    """Creates a clean digital PDF with standard paragraphs and headings."""
    pdf_path = os.path.join(fixtures_dir, "sample_digital.pdf")
    doc = fitz.open()
    page = doc.new_page()

    text = (
        "Introduction to Commercial Audio Synthesis\n\n"
        "This platform accurately converts PDF documents into high-quality MP3 audio files.\n"
        "It supports multi-column text layouts, scanned documents using OCR, and multiple voices.\n"
        "The background processing pipeline guarantees that large documents are chunked\n"
        "and converted reliably without loss of sequence."
    )
    page.insert_text(fitz.Point(50, 72), text, fontsize=12)
    doc.save(pdf_path)
    doc.close()
    return pdf_path

@pytest.fixture(scope="session")
def sample_empty_pdf(fixtures_dir):
    """Creates an empty PDF with no text blocks."""
    pdf_path = os.path.join(fixtures_dir, "sample_empty.pdf")
    doc = fitz.open()
    doc.new_page() # blank page
    doc.save(pdf_path)
    doc.close()
    return pdf_path

@pytest.fixture(scope="session")
def sample_corrupt_pdf(fixtures_dir):
    """Creates a non-PDF corrupted file with wrong magic bytes."""
    corrupt_path = os.path.join(fixtures_dir, "corrupt.pdf")
    with open(corrupt_path, "wb") as f:
        f.write(b"NOT A REAL PDF DOCUMENT AT ALL CORRUPTED HEADER")
    return corrupt_path

