import pytest
import os
from services.processor.app.tts.factory import TTSProviderFactory
from services.processor.app.tts.mock_provider import MockTTSProvider
from services.processor.app.tts.azure_provider import AzureSpeechProvider
from services.processor.app.core.exceptions import TTSConfigurationError

@pytest.mark.asyncio
async def test_tts_factory_returns_mock_provider():
    provider = TTSProviderFactory.get_provider("mock")
    assert isinstance(provider, MockTTSProvider)

@pytest.mark.asyncio
async def test_mock_tts_generates_valid_mp3_frames(tmp_path):
    provider = TTSProviderFactory.get_provider("mock")
    out_file = str(tmp_path / "mock_chunk.mp3")
    res_path = await provider.synthesize_chunk(
        text="Testing audio generation.",
        voice_id="mock-voice-1",
        speech_speed=1.0,
        output_path=out_file,
    )
    assert os.path.exists(res_path)
    assert os.path.getsize(res_path) > 1000 # has valid frames

@pytest.mark.asyncio
async def test_azure_provider_reports_missing_credentials():
    # Instantiating Azure with empty credentials must fail fast with TTSConfigurationError
    provider = AzureSpeechProvider(key=None, region=None)
    with pytest.raises(TTSConfigurationError) as exc_info:
        await provider.synthesize_chunk("Hello", "en-US-JennyNeural", 1.0, "out.mp3")
    assert "Azure Speech configuration missing" in str(exc_info.value)

@pytest.mark.asyncio
async def test_voice_discovery_lists_voices():
    provider = TTSProviderFactory.get_provider("mock")
    voices = await provider.list_available_voices()
    assert len(voices) >= 2
    assert any(v.gender == "MALE" for v in voices)
    assert any(v.gender == "FEMALE" for v in voices)

