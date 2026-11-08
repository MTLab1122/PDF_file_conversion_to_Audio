from services.processor.app.preprocessing.cleaner import TextCleaner

def test_unicode_normalization_ligatures():
    # 'ﬁ' (U+FB01) ligature and smart quotes
    raw = "The ﬁrst speciﬁcation includes “smart quotes” and – em dashes."
    cleaned = TextCleaner.clean(raw)
    assert "first" in cleaned
    assert "specification" in cleaned
    assert "smart quotes" in cleaned

def test_hyphenation_repair_across_lines():
    raw = "This is an infor-\nmation system for pro-\ncessing documents."
    cleaned = TextCleaner.clean(raw)
    assert "information" in cleaned
    assert "processing" in cleaned

def test_paragraph_reconstruction_and_spacing():
    raw = "Line one of the sentence\nis wrapped here.\n\nLine three starts\na new paragraph."
    cleaned = TextCleaner.clean(raw)
    paragraphs = cleaned.split("\n\n")
    assert len(paragraphs) == 2
    assert "Line one of the sentence is wrapped here." in paragraphs[0]
    assert "Line three starts a new paragraph." in paragraphs[1]

def test_remove_control_characters_and_page_numbers():
    raw = "Page text content.\n\n42\n\nNext page text with null \x00 character."
    cleaned = TextCleaner.clean(raw)
    assert "\x00" not in cleaned
    assert "42" not in cleaned # lone page number filtered
    assert "Page text content." in cleaned
    assert "Next page text with null character." in cleaned

