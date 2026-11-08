import os
import pytest
from services.processor.app.audio.merger import AudioMerger
from services.processor.app.audio.validator import AudioValidator
from services.processor.app.core.exceptions import AudioAssemblyError
from services.processor.app.tts.mock_provider import MockTTSProvider

@pytest.mark.asyncio
async def test_merge_multiple_chunks_with_ffmpeg(tmp_path):
    provider = MockTTSProvider()
    chunk1 = str(tmp_path / "chunk_0.mp3")
    chunk2 = str(tmp_path / "chunk_1.mp3")

    await provider.synthesize_chunk("First chunk text", "mock-1", 1.0, chunk1)
    await provider.synthesize_chunk("Second chunk text", "mock-1", 1.0, chunk2)

    final_mp3 = str(tmp_path / "final_assembled.mp3")
    duration, size, bitrate = AudioMerger.merge_chunks(
        chunk_file_paths=[chunk1, chunk2],
        output_mp3_path=final_mp3,
        title="Test Document",
    )

    assert os.path.exists(final_mp3)
    assert size > 2000
    assert duration > 0.5
    assert bitrate > 0

    # Test independent validation
    val_dur, val_size, val_br = AudioValidator.validate_mp3_file(final_mp3)
    assert val_dur == duration
    assert val_size == size

def test_audio_merger_fails_on_missing_chunk(tmp_path):
    with pytest.raises(AudioAssemblyError) as exc_info:
        AudioMerger.merge_chunks(
            chunk_file_paths=["/non/existent/chunk_001.mp3"],
            output_mp3_path=str(tmp_path / "out.mp3"),
        )
    assert "Missing required audio chunk" in str(exc_info.value)

