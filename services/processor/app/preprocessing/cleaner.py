import re
import unicodedata
from typing import List


class TextCleaner:
    """Specialized text preprocessor for TTS synthesis.
    Normalizes Unicode, reconstructs wrapped paragraphs, fixes hyphenation,
    removes extraction artifacts, and preserves natural speech flow.
    """

    @classmethod
    def clean(cls, raw_text: str) -> str:
        """Execute full cleaning and normalization pipeline on extracted text."""
        if not raw_text:
            return ""

        text = raw_text

        # 1. Unicode Normalization (NFKC - converts ligatures like ﬁ, ﬂ, special quotes, full-width chars)
        text = unicodedata.normalize("NFKC", text)

        # 2. Remove null bytes and non-printable control characters (except newline \n and tab \t)
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\ufffd]", "", text)

        # 3. Standardize Line Endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # 4. Repair Hyphenation across line breaks:
        # e.g., "infor- \n mation" -> "information", "pro- \n cess" -> "process"
        text = re.sub(r"(\b\w+)[-‐‑]\s*\n\s*([a-z]\w+\b)", r"\1\2", text)

        # 5. Fix dashed compound words that were split across lines:
        # e.g. "state-\nof-the-art" -> "state-of-the-art"
        text = re.sub(r"(\b\w+)[-‐‑]\s*\n\s*([A-Z]\w+\b)", r"\1-\2", text)

        # 6. Reconstruct Paragraphs and Join Wrapped Lines:
        # Paragraphs are typically separated by double newlines (\n\n) or empty lines.
        # Inside a paragraph, single newlines should be merged with a space unless
        # the line looks like a bullet point or heading.
        raw_paragraphs = text.split("\n\n")
        cleaned_paragraphs: List[str] = []

        for para in raw_paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check if this paragraph is just an isolated page number (e.g. "42", "- 12 -", "Page 5")
            if re.fullmatch(r"(?:page\s+)?-?\s*\d+\s*-?", para, re.IGNORECASE):
                continue

            # Join lines inside the paragraph
            lines = [line.strip() for line in para.split("\n") if line.strip()]
            joined_lines: List[str] = []

            for i, line in enumerate(lines):
                if not joined_lines:
                    joined_lines.append(line)
                else:
                    prev = joined_lines[-1]
                    # If prev line does not end in end-of-sentence punctuation, and next line begins with lowercase, merge
                    if prev.endswith((".", "!", "?", ":", ";")) or line.startswith(("-", "•", "*", "1.", "2.", "3.", "4.", "5.")):
                        joined_lines.append(line)
                    else:
                        joined_lines[-1] = f"{prev} {line}"

            paragraph_text = "\n".join(joined_lines)

            # 7. Normalize intra-line spaces (multiple spaces/tabs -> single space)
            paragraph_text = re.sub(r"[ \t]+", " ", paragraph_text)

            # 8. Normalize repetitive punctuation (e.g. "....." -> "...", "???" -> "?")
            paragraph_text = re.sub(r"\.{4,}", "...", paragraph_text)
            paragraph_text = re.sub(r"\?{2,}", "?", paragraph_text)
            paragraph_text = re.sub(r"!{2,}", "!", paragraph_text)

            cleaned_paragraphs.append(paragraph_text)

        # Re-join paragraphs with double newline
        final_text = "\n\n".join(cleaned_paragraphs).strip()
        return final_text

