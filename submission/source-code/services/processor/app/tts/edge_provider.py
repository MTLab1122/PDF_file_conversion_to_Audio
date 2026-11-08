import asyncio
import os
from typing import List, Optional
import edge_tts
from services.processor.app.core.exceptions import (
    TTSTransientError,
    TTSPermanentError,
)
from services.processor.app.core.logger import logger
from services.processor.app.tts.base import TTSProvider, VoiceInfo


class EdgeTTSProvider(TTSProvider):
    """Production TTS Provider utilizing Microsoft Neural Voices.
    Delivers high-fidelity neural audio with zero fake synthesis.
    """

    DEFAULT_VOICE = "en-US-ChristopherNeural"

    def _format_rate(self, speech_speed: float) -> str:
        """Convert float speech speed (e.g. 0.5 to 2.0) to Edge TTS rate string (+10%, -20%)."""
        clamped = max(0.5, min(2.0, speech_speed))
        percentage = int(round((clamped - 1.0) * 100))
        return f"{percentage:+d}%"

    async def synthesize_chunk(
        self,
        text: str,
        voice_id: str,
        speech_speed: float,
        output_path: str,
        audio_format: str = "mp3",
    ) -> str:
        """Synthesize text chunk into authentic MP3 audio with exponential backoff."""
        if not text or not text.strip():
            raise TTSPermanentError("Text chunk for synthesis is empty.")

        rate_str = self._format_rate(speech_speed)
        voice = voice_id or self.DEFAULT_VOICE

        max_retries = 3
        backoff_seconds = 1.0

        for attempt in range(1, max_retries + 1):
            try:
                communicate = edge_tts.Communicate(
                    text=text,
                    voice=voice,
                    rate=rate_str,
                )
                await communicate.save(output_path)

                # Validate output
                if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
                    raise TTSTransientError(f"TTS generated empty or unreadable audio chunk at {output_path}")

                return output_path

            except Exception as e:
                err_str = str(e).lower()
                # Check for permanent errors (e.g. invalid voice ID)
                if "invalid voice" in err_str or "not found" in err_str:
                    raise TTSPermanentError(f"Permanent Edge TTS voice error: {e}")

                if attempt == max_retries:
                    logger.error(f"Edge TTS synthesis failed after {max_retries} attempts: {e}")
                    raise TTSTransientError(f"Failed synthesizing chunk with Edge TTS: {e}")

                logger.warning(f"Edge TTS attempt {attempt} failed ({e}), retrying in {backoff_seconds}s...")
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2.0

        return output_path

    async def list_available_voices(self, language: Optional[str] = None) -> List[VoiceInfo]:
        """Fetch all Microsoft Neural Voices from live Edge TTS service."""
        try:
            voices = await edge_tts.list_voices()
            results: List[VoiceInfo] = []

            for v in voices:
                short_name = v.get("ShortName", "")
                locale = v.get("Locale", "")
                gender = v.get("Gender", "Neutral").upper()
                friendly_name = v.get("FriendlyName", short_name)

                if language and not locale.lower().startswith(language.lower()):
                    continue

                is_premium = "neural" in short_name.lower() and ("aria" in short_name.lower() or "multilingual" in short_name.lower())

                results.append(
                    VoiceInfo(
                        voice_id=short_name,
                        name=friendly_name,
                        language=locale,
                        language_name=locale,
                        gender=gender,
                        provider="EDGE",
                        is_premium=is_premium,
                    )
                )

            return results
        except Exception as e:
            logger.warning(f"Failed to fetch live Edge TTS voice list: {e}")
            # Fallback to standard core voices
            return [
                VoiceInfo("en-US-ChristopherNeural", "Christopher (Natural, Warm)", "en-US", "English (US)", "MALE", "EDGE", False),
                VoiceInfo("en-US-JennyNeural", "Jenny (Clear, Friendly)", "en-US", "English (US)", "FEMALE", "EDGE", False),
                VoiceInfo("en-US-GuyNeural", "Guy (Narrative, Calm)", "en-US", "English (US)", "MALE", "EDGE", False),
                VoiceInfo("en-US-AriaNeural", "Aria (Expressive, Crisp)", "en-US", "English (US)", "FEMALE", "EDGE", True),
                VoiceInfo("en-GB-SoniaNeural", "Sonia (British, Refined)", "en-GB", "English (UK)", "FEMALE", "EDGE", False),
                VoiceInfo("en-GB-RyanNeural", "Ryan (British, Authoritative)", "en-GB", "English (UK)", "MALE", "EDGE", False),
                VoiceInfo("es-ES-AlvaroNeural", "Alvaro (Spanish, Direct)", "es-ES", "Spanish (Spain)", "MALE", "EDGE", False),
                VoiceInfo("fr-FR-HenriNeural", "Henri (French, Melodic)", "fr-FR", "French (France)", "MALE", "EDGE", False),
                VoiceInfo("de-DE-ConradNeural", "Conrad (German, Articulate)", "de-DE", "German (Germany)", "MALE", "EDGE", False),
            ]

