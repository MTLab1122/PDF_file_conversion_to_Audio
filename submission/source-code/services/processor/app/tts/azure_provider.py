import os
from typing import List, Optional
import httpx
from services.processor.app.config import settings
from services.processor.app.core.exceptions import (
    TTSConfigurationError,
    TTSTransientError,
    TTSPermanentError,
)
from services.processor.app.core.logger import logger
from services.processor.app.tts.base import TTSProvider, VoiceInfo


class AzureSpeechProvider(TTSProvider):
    """Direct Azure Cognitive Services Speech Provider using Microsoft REST API."""

    def __init__(self, key: Optional[str] = None, region: Optional[str] = None):
        self.key = key or settings.AZURE_SPEECH_KEY
        self.region = region or settings.AZURE_SPEECH_REGION

    def _validate_configuration(self):
        """Report clear, explicit error if Azure credentials are missing."""
        if not self.key or not self.region:
            raise TTSConfigurationError(
                "Azure Speech configuration missing: 'AZURE_SPEECH_KEY' and 'AZURE_SPEECH_REGION' must be set."
            )

    async def synthesize_chunk(
        self,
        text: str,
        voice_id: str,
        speech_speed: float,
        output_path: str,
        audio_format: str = "mp3",
    ) -> str:
        self._validate_configuration()

        token_url = f"https://{self.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
        tts_url = f"https://{self.region}.tts.speech.microsoft.com/cognitiveservices/v1"

        speed_percent = int(round((speech_speed - 1.0) * 100))
        rate_str = f"{speed_percent:+d}%"

        # SSML format for Azure
        ssml = (
            f"<speak version='1.0' xml:lang='en-US'>"
            f"<voice name='{voice_id}'>"
            f"<prosody rate='{rate_str}'>{text}</prosody>"
            f"</voice></speak>"
        )

        headers = {
            "Ocp-Apim-Subscription-Key": self.key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-160kbitrate-mono-mp3",
            "User-Agent": "PDFToAudioSaaS",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(tts_url, headers=headers, content=ssml.encode("utf-8"))
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    return output_path
                elif response.status_code in (401, 403):
                    raise TTSConfigurationError(f"Azure Speech Authentication failed: HTTP {response.status_code}")
                elif response.status_code == 400:
                    raise TTSPermanentError(f"Azure Speech request invalid (voice/SSML): {response.text}")
                else:
                    raise TTSTransientError(f"Azure Speech error HTTP {response.status_code}: {response.text}")
            except httpx.TimeoutException:
                raise TTSTransientError("Azure Speech API request timed out after 30 seconds.")
            except Exception as e:
                raise TTSTransientError(f"Azure Speech network communication failed: {str(e)}")

    async def list_available_voices(self, language: Optional[str] = None) -> List[VoiceInfo]:
        self._validate_configuration()
        url = f"https://{self.region}.tts.speech.microsoft.com/cognitiveservices/voices/list"
        headers = {"Ocp-Apim-Subscription-Key": self.key}

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code != 200:
                raise TTSConfigurationError(f"Failed to fetch Azure voices: {res.text}")

            data = res.json()
            voices: List[VoiceInfo] = []
            for item in data:
                short_name = item.get("ShortName")
                locale = item.get("Locale")
                if language and not locale.lower().startswith(language.lower()):
                    continue
                voices.append(
                    VoiceInfo(
                        voice_id=short_name,
                        name=item.get("DisplayName", short_name),
                        language=locale,
                        language_name=locale,
                        gender=item.get("Gender", "Neutral").upper(),
                        provider="AZURE",
                        is_premium=True,
                    )
                )
            return voices

