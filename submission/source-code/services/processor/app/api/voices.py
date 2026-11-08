from typing import List, Optional
from fastapi import APIRouter, Query
from services.processor.app.tts.factory import TTSProviderFactory

router = APIRouter(prefix="/api", tags=["Voices"])


SUPPORTED_LANGUAGES = [
    {"code": "en-US", "name": "English (US)"},
    {"code": "en-GB", "name": "English (UK)"},
    {"code": "es-ES", "name": "Spanish (Spain)"},
    {"code": "fr-FR", "name": "French (France)"},
    {"code": "de-DE", "name": "German (Germany)"},
    {"code": "it-IT", "name": "Italian (Italy)"},
    {"code": "pt-BR", "name": "Portuguese (Brazil)"},
    {"code": "ja-JP", "name": "Japanese (Japan)"},
    {"code": "zh-CN", "name": "Chinese (Simplified)"},
    {"code": "ar-SA", "name": "Arabic (Saudi Arabia)"},
    {"code": "hi-IN", "name": "Hindi (India)"},
    {"code": "ur-PK", "name": "Urdu (Pakistan)"},
]


@router.get("/languages")
def list_languages():
    """Return all supported synthesis languages."""
    return {"languages": SUPPORTED_LANGUAGES}


@router.get("/voices")
async def list_voices(language: Optional[str] = Query(None)):
    """Return discovery list of available neural and standard voices."""
    provider = TTSProviderFactory.get_provider()
    voices = await provider.list_available_voices(language=language)
    return {
        "voices": [v.to_dict() for v in voices],
        "count": len(voices),
    }

