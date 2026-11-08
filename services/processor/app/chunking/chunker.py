import re
from typing import List, Dict, Any


class TextChunk:
    def __init__(self, index: int, text: str, character_count: int):
        self.index = index
        self.text = text
        self.character_count = character_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "text": self.text,
            "character_count": self.character_count,
            "preview": (self.text[:80] + "...") if len(self.text) > 80 else self.text,
        }


class TextChunker:
    """Intelligent sentence-aware and paragraph-aware text chunker for TTS processing.
    Guarantees strict sequential ordering, preserves complete sentences, and prevents word splitting.
    """

    def __init__(
        self,
        target_chunk_size: int = 1000,
        max_chunk_size: int = 1400,
        min_chunk_size: int = 200,
    ):
        self.target_chunk_size = target_chunk_size
        self.max_chunk_size = max_chunk_size
        self.min_chunk_size = min_chunk_size

    def chunk_document(self, cleaned_text: str) -> List[TextChunk]:
        """Split cleaned text into ordered chunks suitable for TTS synthesis."""
        if not cleaned_text or not cleaned_text.strip():
            return []

        # Split by paragraphs first
        paragraphs = cleaned_text.split("\n\n")
        chunks: List[TextChunk] = []
        current_chunk_sentences: List[str] = []
        current_char_count = 0
        chunk_index = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Split paragraph into sentences using regex boundary detection
            # Matches sentence end punctuation followed by space or end of string
            sentences = self._split_sentences(para)

            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue

                sent_len = len(sentence)

                # If a single sentence exceeds max_chunk_size, break it by clauses / sub-phrases
                if sent_len > self.max_chunk_size:
                    sub_sentences = self._split_long_sentence(sentence, self.target_chunk_size)
                else:
                    sub_sentences = [sentence]

                for sub in sub_sentences:
                    sub_len = len(sub)
                    # Check if adding this would exceed max chunk size
                    if current_char_count + sub_len > self.max_chunk_size and current_chunk_sentences:
                        # Flush current chunk
                        chunk_text = " ".join(current_chunk_sentences).strip()
                        chunks.append(TextChunk(chunk_index, chunk_text, len(chunk_text)))
                        chunk_index += 1
                        current_chunk_sentences = [sub]
                        current_char_count = sub_len
                    else:
                        current_chunk_sentences.append(sub)
                        current_char_count += sub_len + 1

                    # If target size reached and sentence ended, flush
                    if current_char_count >= self.target_chunk_size:
                        chunk_text = " ".join(current_chunk_sentences).strip()
                        chunks.append(TextChunk(chunk_index, chunk_text, len(chunk_text)))
                        chunk_index += 1
                        current_chunk_sentences = []
                        current_char_count = 0

        # Flush any trailing sentences
        if current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences).strip()
            if chunk_text:
                chunks.append(TextChunk(chunk_index, chunk_text, len(chunk_text)))

        return chunks

    def _split_sentences(self, paragraph: str) -> List[str]:
        """Split text into sentences while respecting common abbreviations (Mr., Dr., etc.)."""
        # Protect common abbreviations:
        protected = paragraph
        abbreviations = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.", "vs.", "etc.", "i.e.", "e.g.", "Fig."]
        for i, abbr in enumerate(abbreviations):
            placeholder = f"__ABBR_{i}__"
            protected = protected.replace(abbr, placeholder)

        # Split on sentence boundaries: (. | ! | ?) followed by space or newline
        raw_parts = re.split(r"([.!?]+(?:\s+|\n+|$))", protected)

        sentences: List[str] = []
        current = ""
        for part in raw_parts:
            current += part
            if re.search(r"[.!?]+(?:\s+|\n+|$)", part):
                # Restore abbreviations
                for i, abbr in enumerate(abbreviations):
                    current = current.replace(f"__ABBR_{i}__", abbr)
                sentences.append(current.strip())
                current = ""

        if current.strip():
            for i, abbr in enumerate(abbreviations):
                current = current.replace(f"__ABBR_{i}__", abbr)
            sentences.append(current.strip())

        return [s for s in sentences if s]

    def _split_long_sentence(self, sentence: str, max_size: int) -> List[str]:
        """Break down an exceptionally long sentence using commas, semicolons, or word boundaries."""
        clauses = re.split(r"([,;:\-—]\s+)", sentence)
        parts: List[str] = []
        buf = ""

        for piece in clauses:
            if len(buf) + len(piece) > max_size and buf:
                parts.append(buf.strip())
                buf = piece
            else:
                buf += piece

        if buf.strip():
            # If still larger than max_size, break strictly on word boundaries
            if len(buf) > max_size:
                words = buf.split(" ")
                word_buf = ""
                for w in words:
                    if len(word_buf) + len(w) + 1 > max_size and word_buf:
                        parts.append(word_buf.strip())
                        word_buf = w
                    else:
                        word_buf = f"{word_buf} {w}" if word_buf else w
                if word_buf.strip():
                    parts.append(word_buf.strip())
            else:
                parts.append(buf.strip())

        return parts


text_chunker = TextChunker()

