import os
import io
from typing import Optional, Dict, Any
from PIL import Image
import fitz # PyMuPDF
from services.processor.app.config import settings
from services.processor.app.core.logger import logger
from services.processor.app.core.exceptions import OCRExtractionError


class OCREngine:
    """Optical Character Recognition engine utilizing Tesseract and Pillow for scanned documents."""

    def __init__(self, tesseract_cmd: Optional[str] = None, default_dpi: int = 300):
        self.dpi = default_dpi
        self.tesseract_cmd = tesseract_cmd or settings.TESSERACT_PATH
        self._pytesseract = None
        self._is_tesseract_available = None

        if self.tesseract_cmd:
            try:
                import pytesseract
                pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd
            except Exception as e:
                logger.warning(f"Failed setting custom tesseract path: {e}")

    def _check_tesseract(self) -> bool:
        if self._is_tesseract_available is not None:
            return self._is_tesseract_available

        try:
            import pytesseract
            # Test if tesseract is executable
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract OCR detected, version: {version}")
            self._pytesseract = pytesseract
            self._is_tesseract_available = True
            return True
        except Exception as e:
            logger.warning(f"Tesseract OCR is not available on host system: {e}. Scanned pages will use best-effort text fallback.")
            self._is_tesseract_available = False
            return False

    def ocr_page(
        self,
        doc_or_path: Any,
        page_number: int,
        language: str = "eng",
        dpi: Optional[int] = None,
    ) -> str:
        """Render a specific page to an image and run OCR."""
        target_dpi = dpi or self.dpi
        logger.info(f"Running OCR on page {page_number} at {target_dpi} DPI (lang: {language})")

        # Load page
        doc = None
        should_close = False
        try:
            if isinstance(doc_or_path, str):
                doc = fitz.open(doc_or_path)
                should_close = True
            else:
                doc = doc_or_path

            page = doc[page_number - 1]

            # Render page to Pixmap at designated DPI
            pix = page.get_pixmap(dpi=target_dpi, alpha=False)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))

            # Check if Tesseract is available
            if self._check_tesseract():
                try:
                    # Clean language code for tesseract (e.g. en-US -> eng, es-ES -> spa, fr-FR -> fra)
                    tess_lang = self._normalize_tess_lang(language)
                    extracted_text = self._pytesseract.image_to_string(image, lang=tess_lang)
                    return extracted_text.strip()
                except Exception as e:
                    logger.error(f"Tesseract OCR execution failed on page {page_number}: {e}")
                    raise OCRExtractionError(f"OCR failed on page {page_number}: {str(e)}")
            else:
                # Best-effort fallback when OCR binary is not installed in local non-docker environment:
                # Return standard page text if any, or placeholder notice
                fallback_text = page.get_text("text").strip()
                if fallback_text:
                    return fallback_text
                return f"[Scanned Page {page_number} - Image Content]"

        finally:
            if should_close and doc:
                doc.close()

    def _normalize_tess_lang(self, lang_code: str) -> str:
        """Map ISO language codes to Tesseract 3-letter codes."""
        mapping = {
            "en": "eng", "en-US": "eng", "en-GB": "eng",
            "es": "spa", "es-ES": "spa",
            "fr": "fra", "fr-FR": "fra",
            "de": "deu", "de-DE": "deu",
            "it": "ita", "it-IT": "ita",
            "pt": "por", "pt-BR": "por",
            "ja": "jpn", "ja-JP": "jpn",
            "zh": "chi_sim", "zh-CN": "chi_sim",
            "ar": "ara", "ar-SA": "ara",
            "hi": "hin", "hi-IN": "hin",
            "ur": "urd", "ur-PK": "urd",
        }
        return mapping.get(lang_code, "eng")


ocr_engine = OCREngine()

