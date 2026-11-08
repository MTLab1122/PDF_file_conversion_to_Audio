class ProcessingBaseException(Exception):
    """Base exception for all document and audio processing errors."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class DocumentSecurityError(ProcessingBaseException):
    """Raised when an uploaded document fails security inspection (e.g. malicious payload, path traversal)."""
    pass


class DocumentCorruptedError(ProcessingBaseException):
    """Raised when a document header, trailer, or cross-reference table is unreadable/corrupted."""
    pass


class PageCountExceededError(ProcessingBaseException):
    """Raised when a document exceeds the page limit configured for the user's tier."""
    pass


class FileSizeExceededError(ProcessingBaseException):
    """Raised when a document exceeds the maximum permitted file size."""
    pass


class OCRExtractionError(ProcessingBaseException):
    """Raised when optical character recognition fails on a page."""
    pass


class TTSConfigurationError(ProcessingBaseException):
    """Raised when required credentials or settings for a TTS provider are missing."""
    pass


class TTSTransientError(ProcessingBaseException):
    """Raised when a temporary network or rate-limit issue occurs with the TTS provider."""
    pass


class TTSPermanentError(ProcessingBaseException):
    """Raised when an unrecoverable error occurs (e.g. invalid voice ID, unsupported language)."""
    pass


class AudioAssemblyError(ProcessingBaseException):
    """Raised when FFmpeg fails to concatenate or re-encode audio chunks."""
    pass


class AudioValidationError(ProcessingBaseException):
    """Raised when generated audio output is empty, silent, or corrupt."""
    pass


class StorageAccessError(ProcessingBaseException):
    """Raised when file storage read/write operations fail."""
    pass


class ResourceNotFoundError(ProcessingBaseException):
    """Raised when a requested document, job, or chunk cannot be found."""
    pass


class ConcurrencyLimitError(ProcessingBaseException):
    """Raised when user exceeds active concurrent conversion limit."""
    pass

