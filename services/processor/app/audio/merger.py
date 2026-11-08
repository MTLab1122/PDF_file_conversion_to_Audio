import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Tuple
from services.processor.app.audio.validator import AudioValidator
from services.processor.app.core.exceptions import AudioAssemblyError
from services.processor.app.core.logger import logger


class AudioMerger:
    """Merges multiple sequential audio chunks into a unified, high-quality MP3 file using FFmpeg."""

    @classmethod
    def merge_chunks(
        cls,
        chunk_file_paths: List[str],
        output_mp3_path: str,
        title: str = "PDF to Audio",
        artist: str = "PDF-to-Audio Platform",
    ) -> Tuple[float, int, int]:
        """Sequentially concatenate audio chunks into final MP3 file and validate.
        Returns: (duration_seconds, file_size_bytes, bitrate_kbps).
        Raises: AudioAssemblyError.
        """
        if not chunk_file_paths:
            raise AudioAssemblyError("No audio chunks provided for assembly.")

        # 1. Verify existence and non-zero size for every chunk in order
        for idx, path in enumerate(chunk_file_paths):
            if not os.path.exists(path):
                raise AudioAssemblyError(f"Missing required audio chunk #{idx} at: {path}")
            if os.path.getsize(path) < 100:
                raise AudioAssemblyError(f"Audio chunk #{idx} is incomplete or empty ({path})")

        # 2. If single chunk, convert or copy to destination with metadata
        if len(chunk_file_paths) == 1:
            return cls._process_single_chunk(chunk_file_paths[0], output_mp3_path, title, artist)

        # 3. Multiple chunks: Create FFmpeg concat list file
        concat_list_file = None
        try:
            with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
                concat_list_file = f.name
                for p in chunk_file_paths:
                    # Normalize Windows path to forward slashes and escape single quotes for FFmpeg concat demuxer
                    normalized_path = p.replace("\\", "/").replace("'", "'\\''")
                    f.write(f"file '{normalized_path}'\n")

            # Run FFmpeg to concatenate and re-encode to clean, standardized MP3
            ffmpeg_cmd = [
                "ffmpeg",
                "-y", # overwrite output
                "-f", "concat",
                "-safe", "0",
                "-i", concat_list_file,
                "-c:a", "libmp3lame",
                "-b:a", "128k",
                "-ar", "44100",
                "-metadata", f"title={title}",
                "-metadata", f"artist={artist}",
                "-metadata", "album=PDF to Audio Conversions",
                output_mp3_path,
            ]

            logger.info(f"Assembling {len(chunk_file_paths)} audio chunks into: {output_mp3_path}")
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=180,
            )

            if result.returncode != 0:
                logger.error(f"FFmpeg assembly failed: {result.stderr}")
                raise AudioAssemblyError(f"FFmpeg concatenation failed: {result.stderr[:300]}")

            # 4. Strict Quality Gate: Validate Final Audio File
            duration, size, bitrate = AudioValidator.validate_mp3_file(output_mp3_path)
            logger.info(
                f"Successfully assembled and validated MP3: {output_mp3_path} "
                f"({duration:.2f}s, {size} bytes, {bitrate} kbps)"
            )
            return duration, size, bitrate

        except subprocess.TimeoutExpired:
            raise AudioAssemblyError("FFmpeg assembly timed out after 180 seconds.")
        except Exception as e:
            if isinstance(e, AudioAssemblyError):
                raise
            raise AudioAssemblyError(f"Unexpected error during audio assembly: {str(e)}")

        finally:
            if concat_list_file and os.path.exists(concat_list_file):
                try:
                    os.unlink(concat_list_file)
                except Exception:
                    pass

    @classmethod
    def _process_single_chunk(
        cls,
        single_chunk_path: str,
        output_mp3_path: str,
        title: str,
        artist: str,
    ) -> Tuple[float, int, int]:
        """Process and tag a single chunk directly."""
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-i", single_chunk_path,
            "-c:a", "libmp3lame",
            "-b:a", "128k",
            "-metadata", f"title={title}",
            "-metadata", f"artist={artist}",
            output_mp3_path,
        ]
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            raise AudioAssemblyError(f"FFmpeg tagging failed: {result.stderr[:200]}")

        return AudioValidator.validate_mp3_file(output_mp3_path)
