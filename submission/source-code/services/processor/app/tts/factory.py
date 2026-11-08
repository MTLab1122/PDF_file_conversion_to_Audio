from typing import Optional
from services.processor.app.config import settings
from services.processor.app.core.exceptions import TTSConfigurationError
from services.processor.app.tts.base import TTSProvider
from services.processor.app.tts.edge_provider import EdgeTTSProvider
from services.processor.app.tts.azure_provider import AzureSpeechProvider
from services.processor.app.tts.mock_provider import MockTTSProvider


class TTSProviderFactory:
    """Factory creating and configuring the appropriate TTS provider instance."""

    _instances = {}

    @classmethod
    def get_provider(cls, provider_type: Optional[str] = None) -> TTSProvider:
        selected = (provider_type or settings.TTS_PROVIDER).strip().lower()

        if selected in cls._instances:
            return cls._instances[selected]

        if selected == "edge":
            provider = EdgeTTSProvider()
        elif selected == "azure":
            provider = AzureSpeechProvider()
        elif selected == "mock":
            provider = MockTTSProvider()
        else:
            raise TTSConfigurationError(
                f"Unsupported TTS provider '{selected}'. Supported providers: 'edge', 'azure', 'mock'."
            )

        cls._instances[selected] = provider
        return provider

