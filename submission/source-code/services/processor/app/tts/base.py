from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class VoiceInfo:
    def __init__(
        self,
        voice_id: str,
        name: str,
        language: str,
        language_name: str,
        gender: str,
        provider: str,
        is_premium: bool = False,
    ):
        self.voice_id = voice_id
        self.name = name
        self.language = language
        self.language_name = language_name
        self.gender = gender
        self.provider = provider
        self.is_premium = is_premium

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.voice_id,
            "name": self.name,
            "language": self.language,
            "languageName": self.language_name,
            "gender": self.gender,
            "provider": self.provider,
            "isPremium": self.is_premium,
        }


class TTSProvider(ABC):
    """Abstract interface defining standard contract for all Text-to-Speech engines."""

    @abstractmethod
    async def synthesize_chunk(
        self,
        text: str,
        voice_id: str,
        speech_speed: float,
        output_path: str,
        audio_format: str = "mp3",
    ) -> str:
        """Synthesize a text chunk to an audio file on disk.
        Returns the absolute path of the generated audio chunk.
        Raises: TTSConfigurationError, TTSTransientError, TTSPermanentError.
        """
        pass

    @abstractmethod
    async def list_available_voices(self, language: Optional[str] = None) -> List[VoiceInfo]:
        """Discover and return all supported voices, optionally filtered by language code."""
        pass

