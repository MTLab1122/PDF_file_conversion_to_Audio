import os
import subprocess
from typing import List, Optional
from services.processor.app.tts.base import TTSProvider, VoiceInfo


class MockTTSProvider(TTSProvider):
    """Deterministic Mock Provider strictly for isolated unit and integration testing.
    Generates genuine, standards-compliant MP3 audio via FFmpeg sine wave generator
    so FFmpeg concat demuxer and FFprobe validation pass with 100% compliance.
    """

    async def synthesize_chunk(
        self,
        text: str,
        voice_id: str,
        speech_speed: float,
        output_path: str,
        audio_format: str = "mp3",
    ) -> str:
        # Generate 1.0 second of clean 440Hz tone as valid MP3
        cmd = [
            "ffmpeg",
            "-y",
            "-f", "lavfi",
            "-i", "sine=frequency=440:duration=1.0",
            "-c:a", "libmp3lame",
            "-b:a", "128k",
            "-ar", "44100",
            output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode != 0:
            # Fallback in case ffmpeg command line differs
            with open(output_path, "wb") as f:
                f.write(b"\xff\xfb\x90d" + b"\x00" * 400)
        return output_path

    async def list_available_voices(self, language: Optional[str] = None) -> List[VoiceInfo]:
        return [
            VoiceInfo("mock-voice-1", "Mock Voice Male", "en-US", "English (US)", "MALE", "MOCK", False),
            VoiceInfo("mock-voice-2", "Mock Voice Female", "en-US", "English (US)", "FEMALE", "MOCK", True),
        ]
