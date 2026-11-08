from typing import List, Dict, Any, Optional
import fitz # PyMuPDF
from services.processor.app.core.logger import logger
from services.processor.app.extraction.pdf_safety import PDFSafetyValidator


class ExtractedPage:
    def __init__(
        self,
        page_number: int,
        text: str,
        needs_ocr: bool = False,
        char_count: int = 0,
        blocks_count: int = 0,
    ):
        self.page_number = page_number
        self.text = text
        self.needs_ocr = needs_ocr
        self.char_count = char_count
        self.blocks_count = blocks_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "text": self.text,
            "needs_ocr": self.needs_ocr,
            "char_count": self.char_count,
            "blocks_count": self.blocks_count,
        }


class PDFExtractor:
    """High-fidelity PDF text extractor with reading-order preservation,
    multi-column handling, header/footer filtering, and OCR fallback detection.
    """

    MIN_TEXT_THRESHOLD_CHARS = 40

    @classmethod
    def extract_document(
        cls,
        file_path: str,
        filter_headers_footers: bool = True,
    ) -> List[ExtractedPage]:
        """Extract pages from PDF while maintaining reading order and detecting scanned pages."""
        # First ensure file is structurally safe
        PDFSafetyValidator.validate_file(file_path)

        doc = fitz.open(file_path)
        pages_result: List[ExtractedPage] = []
        raw_headers_footers: Dict[str, int] = {}

        try:
            # First pass: collect potential recurring headers/footers if document > 2 pages
            if filter_headers_footers and len(doc) > 2:
                for page_idx in range(len(doc)):
                    page = doc[page_idx]
                    rect = page.rect
                    height = rect.height
                    # Inspect top 6% and bottom 6% of the page
                    blocks = page.get_text("blocks")
                    for b in blocks:
                        # b: (x0, y0, x1, y1, text, block_no, block_type)
                        if b[6] == 0: # text block
                            y0, y1, text = b[1], b[3], b[4].strip()
                            if (y0 < height * 0.07 or y1 > height * 0.93) and len(text) < 120 and len(text) > 2:
                                raw_headers_footers[text] = raw_headers_footers.get(text, 0) + 1

            # Determine genuine recurring headers/footers (present on >= 50% of pages)
            threshold = max(2, len(doc) // 2)
            recurring_hf = {
                text for text, count in raw_headers_footers.items() if count >= threshold
            }
            if recurring_hf:
                logger.info(f"Identified {len(recurring_hf)} recurring header/footer elements to conservatively filter.")

            # Second pass: page-by-page extraction with reading order preservation
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                page_num = page_idx + 1
                page_rect = page.rect

                # Blocks return: (x0, y0, x1, y1, "lines\ntext", block_no, block_type)
                # block_type == 0 is text, 1 is image
                blocks = page.get_text("blocks")

                text_blocks = [b for b in blocks if b[6] == 0 and b[4].strip()]

                # Handle multi-column reading order:
                # Group blocks into columns by horizontal coordinate (x0), then sort vertically (y0)
                # For standard single column, this simplifies to vertical order (y0).
                # Sort criteria: round x0 to detect columns, then sort by y0
                # Detect column layout: check if multiple text blocks span distinct left/right halves
                page_mid_x = page_rect.width / 2.0
                has_multi_column = False

                left_col_blocks = []
                right_col_blocks = []

                for b in text_blocks:
                    x0, x1 = b[0], b[2]
                    # If block strictly on left or right with standard margins
                    if x1 <= page_mid_x + 20:
                        left_col_blocks.append(b)
                    elif x0 >= page_mid_x - 20:
                        right_col_blocks.append(b)

                # If substantial content is clearly separated across mid-line, sort left-column then right-column
                if len(left_col_blocks) >= 2 and len(right_col_blocks) >= 2:
                    has_multi_column = True
                    left_col_blocks.sort(key=lambda b: (b[1], b[0]))
                    right_col_blocks.sort(key=lambda b: (b[1], b[0]))
                    sorted_blocks = left_col_blocks + right_col_blocks
                else:
                    # Standard reading order: top-to-bottom, left-to-right
                    sorted_blocks = sorted(text_blocks, key=lambda b: (b[1], b[0]))

                # Assemble page text
                page_paragraphs: List[str] = []
                for b in sorted_blocks:
                    block_text = b[4].strip()
                    if not block_text:
                        continue

                    # Filter recurring headers/footers
                    if filter_headers_footers and block_text in recurring_hf:
                        continue

                    page_paragraphs.append(block_text)

                combined_text = "\n\n".join(page_paragraphs).strip()
                char_count = len(combined_text)

                # Check if page has insufficient digital text (scanned page or image-only)
                needs_ocr = char_count < cls.MIN_TEXT_THRESHOLD_CHARS

                pages_result.append(
                    ExtractedPage(
                        page_number=page_num,
                        text=combined_text,
                        needs_ocr=needs_ocr,
                        char_count=char_count,
                        blocks_count=len(sorted_blocks),
                    )
                )

            logger.info(
                f"Extracted {len(pages_result)} pages from {file_path}. "
                f"Pages requiring OCR: {sum(1 for p in pages_result if p.needs_ocr)}"
            )
            return pages_result

        finally:
            doc.close()

