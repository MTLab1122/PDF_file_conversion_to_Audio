import json
import os
import subprocess
from typing import Dict, Any, Tuple
from services.processor.app.core.exceptions import AudioValidationError
from services.processor.app.core.logger import logger


class AudioValidator:
    """Rigorous audio file validator using FFprobe and Mutagen metadata inspections."""

    @classmethod
    def validate_mp3_file(cls, file_path: str) -> Tuple[float, int, int]:
        """Validate an MP3 file on disk.
        Returns: (duration_seconds, file_size_bytes, bitrate_kbps).
        Raises: AudioValidationError if the file is invalid, empty, or unplayable.
        """
        if not os.path.exists(file_path):
            raise AudioValidationError(f"Audio file does not exist: {file_path}")

        file_size = os.path.getsize(file_path)
        if file_size < 1000:
            raise AudioValidationError(f"Audio file is too small ({file_size} bytes), incomplete or empty.")

        # 1. Primary Inspection with FFprobe
        ffprobe_cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            file_path,
        ]

        try:
            result = subprocess.run(
                ffprobe_cmd,
                capture_output=True,
                text=True,
                timeout=15,
                check=True,
            )
            data = json.loads(result.stdout)
        except Exception as e:
            logger.warning(f"FFprobe check failed ({e}), falling back to Mutagen/Header check.")
            return cls._fallback_mutagen_validate(file_path, file_size)

        format_info = data.get("format", {})
        streams = data.get("streams", [])

        # Verify at least one audio stream is present
        audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)
        if not audio_stream:
            raise AudioValidationError("Audio file contains no valid audio streams.")

        codec_name = audio_stream.get("codec_name", "").lower()
        if codec_name != "mp3":
            logger.warning(f"Audio stream codec is {codec_name}, expected mp3.")

        try:
            duration = float(format_info.get("duration", 0.0))
            if duration <= 0.0:
                duration = float(audio_stream.get("duration", 0.0))
        except (ValueError, TypeError):
            duration = 0.0

        if duration <= 0.05:
            raise AudioValidationError(f"Invalid or near-zero audio duration ({duration}s).")

        bitrate = int(format_info.get("bit_rate", 128000)) // 1000

        logger.info(f"Audio validation passed: {file_path} ({duration:.2f}s, {file_size} bytes, {bitrate} kbps)")
        return duration, file_size, bitrate

    @classmethod
    def _fallback_mutagen_validate(cls, file_path: str, file_size: int) -> Tuple[float, int, int]:
        """Fallback validation using mutagen library."""
        try:
            from mutagen.mp3 import MP3
            audio = MP3(file_path)
            duration = float(audio.info.length)
            bitrate = int(audio.info.bitrate / 1000) if audio.info.bitrate else 128

            if duration <= 0.05:
                raise AudioValidationError("Mutagen detected non-positive audio duration.")

            return duration, file_size, bitrate
        except Exception as e:
            raise AudioValidationError(f"Audio file failed validation: {str(e)}")

