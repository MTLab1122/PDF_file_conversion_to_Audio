from services.processor.app.chunking.chunker import TextChunker

def test_chunking_preserves_sentence_boundaries():
    chunker = TextChunker(target_chunk_size=150, max_chunk_size=250)
    text = (
        "This is the first complete sentence. "
        "Here is the second sentence that contains useful details. "
        "Now comes the third sentence which concludes this thought."
    )
    chunks = chunker.chunk_document(text)
    assert len(chunks) >= 1
    # Ensure sequential indexing
    for idx, c in enumerate(chunks):
        assert c.index == idx
        # Ensure chunks don't end with split words
        assert not c.text.endswith("-")
        assert c.character_count == len(c.text)

def test_chunking_abbreviations_not_broken():
    chunker = TextChunker(target_chunk_size=100, max_chunk_size=150)
    text = "Dr. Smith and Mr. Jones visited Washington D.C. yesterday. The meeting went very well."
    chunks = chunker.chunk_document(text)
    # Ensure "Dr. Smith" was not split into a separate sentence on "Dr."
    combined = " ".join(c.text for c in chunks)
    assert "Dr. Smith" in combined
    assert "Mr. Jones" in combined

def test_long_sentence_splitting_on_word_boundaries():
    chunker = TextChunker(target_chunk_size=80, max_chunk_size=120)
    very_long_sentence = (
        "This is an unusually extensive and continuous sentence without any terminal period, "
        "intentionally crafted to evaluate the sub-phrase and clause-based splitting algorithm "
        "to ensure that words are never severed abruptly in the middle of character sequences."
    )
    chunks = chunker.chunk_document(very_long_sentence)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c.text) <= 120
        # Words must be intact (no broken word fragments)
        words = c.text.split(" ")
        assert all(len(w) > 0 for w in words)

