import fitz  # PyMuPDF
import os
from PIL import Image, ImageDraw, ImageFont

def generate_samples():
    out_dir = os.path.abspath("submission/sample-files")
    os.makedirs(out_dir, exist_ok=True)

    # 1. Digital Sample PDF (3 pages)
    doc = fitz.open()
    
    # Page 1
    page1 = doc.new_page()
    page1.insert_text(
        fitz.Point(72, 100),
        "AudioDoc Commercial Platform: Technical Whitepaper",
        fontsize=18,
        color=(0.1, 0.2, 0.6)
    )
    page1.insert_text(
        fitz.Point(72, 140),
        "Abstract\n"
        "This paper presents the architectural design and implementation of AudioDoc, a high-throughput "
        "document-to-speech platform capable of converting multi-page structured PDFs into natural neural audiobooks. "
        "The system combines PyMuPDF structural layout parsing, Tesseract optical character recognition, and "
        "sentence-aware text chunking with FFmpeg audio assembly.",
        fontsize=11
    )
    page1.insert_text(
        fitz.Point(72, 240),
        "1. Architectural Principles\n"
        "Modern digital publications frequently employ multi-column layouts, footnotes, and specialized typography. "
        "AudioDoc maintains the reading sequence across page boundaries while filtering redundant header artifacts. "
        "Text normalization ensures that hyphenated words spanning line breaks are seamlessly joined before reaching the "
        "speech synthesis engine.",
        fontsize=11
    )

    # Page 2
    page2 = doc.new_page()
    page2.insert_text(
        fitz.Point(72, 100),
        "2. Neural Speech Synthesis and Audio Concatenation",
        fontsize=14,
        color=(0.1, 0.2, 0.6)
    )
    page2.insert_text(
        fitz.Point(72, 140),
        "Audio synthesis proceeds through an asynchronous pipeline. Text blocks are partitioned into sentence-bounded "
        "chunks within configured character limits. Each chunk is dispatched to a high-definition neural speech engine "
        "with automatic exponential backoff. Upon chunk validation, the FFmpeg concatenation demuxer joins the raw audio "
        "streams into a 24 kHz MP3 file with standard ID3 metadata tags.",
        fontsize=11
    )

    # Page 3
    page3 = doc.new_page()
    page3.insert_text(
        fitz.Point(72, 100),
        "3. Conclusion and Operational Results",
        fontsize=14,
        color=(0.1, 0.2, 0.6)
    )
    page3.insert_text(
        fitz.Point(72, 140),
        "The resulting platform delivers commercial-grade reliability, comprehensive ownership isolation, and "
        "low-latency audio playback suitable for demanding publishing workflows and daily research consumption.",
        fontsize=11
    )

    digital_path = os.path.join(out_dir, "digital_sample.pdf")
    doc.save(digital_path)
    doc.close()
    print(f"Created: {digital_path}")

    # 2. Scanned Sample PDF (Raster image with embedded text)
    img = Image.new("RGB", (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((60, 80), "SCANNED ARCHIVAL DOCUMENT", fill=(20, 20, 20))
    draw.text((60, 140), "This document was scanned from historical paper archives.", fill=(30, 30, 30))
    draw.text((60, 180), "Optical Character Recognition (OCR) must extract this textual content.", fill=(30, 30, 30))
    draw.text((60, 220), "Tesseract detects characters rendered directly onto raster pixmaps.", fill=(30, 30, 30))
    
    img_temp = os.path.join(out_dir, "temp_scan.png")
    img.save(img_temp)

    scanned_doc = fitz.open()
    scanned_page = scanned_doc.new_page(width=612, height=792)
    scanned_page.insert_image(scanned_page.rect, filename=img_temp)
    scanned_path = os.path.join(out_dir, "scanned_sample.pdf")
    scanned_doc.save(scanned_path)
    scanned_doc.close()
    if os.path.exists(img_temp):
        os.remove(img_temp)
    print(f"Created: {scanned_path}")

    # 3. Empty Sample PDF
    empty_doc = fitz.open()
    empty_doc.new_page()
    empty_path = os.path.join(out_dir, "empty_sample.pdf")
    empty_doc.save(empty_path)
    empty_doc.close()
    print(f"Created: {empty_path}")

    # 4. Corrupted Sample PDF (Not a valid PDF)
    corrupted_path = os.path.join(out_dir, "corrupted_sample.pdf")
    with open(corrupted_path, "wb") as f:
        f.write(b"NOT_A_PDF_INVALID_BINARY_DATA_CORRUPTED_STREAM_RANDOM_BYTES_1234567890")
    print(f"Created: {corrupted_path}")

if __name__ == "__main__":
    generate_samples()
