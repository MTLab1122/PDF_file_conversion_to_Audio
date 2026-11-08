import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Text,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class RoleEnum(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class SubscriptionTierEnum(str, enum.Enum):
    FREE = "FREE"
    PRO = "PRO"
    BUSINESS = "BUSINESS"


class JobStatusEnum(str, enum.Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    EXTRACTING = "EXTRACTING"
    OCR = "OCR"
    PREPROCESSING = "PREPROCESSING"
    CHUNKING = "CHUNKING"
    GENERATING_AUDIO = "GENERATING_AUDIO"
    MERGING = "MERGING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ChunkStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AudioFormatEnum(str, enum.Enum):
    MP3 = "MP3"
    WAV = "WAV"
    OGG = "OGG"


class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    emailVerified = Column(DateTime, nullable=True)
    passwordHash = Column(String, nullable=True)
    image = Column(String, nullable=True)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.USER, nullable=False)
    subscriptionTier = Column(SQLEnum(SubscriptionTierEnum), default=SubscriptionTierEnum.FREE, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    conversionJobs = relationship("ConversionJob", back_populates="user", cascade="all, delete-orphan")
    audioFiles = relationship("AudioFile", back_populates="user", cascade="all, delete-orphan")
    usageRecords = relationship("UsageRecord", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "Subscription"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), unique=True, nullable=False)
    tier = Column(SQLEnum(SubscriptionTierEnum), default=SubscriptionTierEnum.FREE, nullable=False)
    status = Column(String, default="active", nullable=False)
    currentPeriodStart = Column(DateTime, default=datetime.utcnow, nullable=False)
    currentPeriodEnd = Column(DateTime, nullable=False)
    stripeCustomerId = Column(String, nullable=True)
    stripeSubscriptionId = Column(String, nullable=True)
    cancelAtPeriodEnd = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="subscription")


class UsageRecord(Base):
    __tablename__ = "UsageRecord"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    periodStart = Column(DateTime, nullable=False)
    periodEnd = Column(DateTime, nullable=False)
    conversionsCount = Column(Integer, default=0, nullable=False)
    pagesProcessed = Column(Integer, default=0, nullable=False)
    charactersCount = Column(Integer, default=0, nullable=False)
    storageBytes = Column(BigInteger, default=0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="usageRecords")

    __table_args__ = (
        UniqueConstraint("userId", "periodStart", name="uq_user_period"),
    )


class Document(Base):
    __tablename__ = "Document"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    originalName = Column(String, nullable=False)
    fileSizeBytes = Column(BigInteger, nullable=False)
    mimeType = Column(String, default="application/pdf", nullable=False)
    pageCount = Column(Integer, nullable=True)
    sha256Hash = Column(String, nullable=False, index=True)
    storagePath = Column(String, nullable=False)
    isScanned = Column(Boolean, default=False, nullable=False)
    ocrApplied = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="documents")
    conversionJobs = relationship("ConversionJob", back_populates="document", cascade="all, delete-orphan")


class ConversionJob(Base):
    __tablename__ = "ConversionJob"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    documentId = Column(String, ForeignKey("Document.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(JobStatusEnum), default=JobStatusEnum.QUEUED, nullable=False, index=True)
    progressPercent = Column(Float, default=0.0, nullable=False)
    currentStage = Column(String, default="QUEUED", nullable=False)
    voiceId = Column(String, default="en-US-ChristopherNeural", nullable=False)
    language = Column(String, default="en-US", nullable=False)
    speechSpeed = Column(Float, default=1.0, nullable=False)
    totalChunks = Column(Integer, default=0, nullable=False)
    completedChunks = Column(Integer, default=0, nullable=False)
    errorMessage = Column(Text, nullable=True)
    retryCount = Column(Integer, default=0, nullable=False)
    idempotencyKey = Column(String, unique=True, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="conversionJobs")
    document = relationship("Document", back_populates="conversionJobs")
    chunks = relationship("AudioChunk", back_populates="job", cascade="all, delete-orphan")
    audioFile = relationship("AudioFile", back_populates="job", uselist=False, cascade="all, delete-orphan")


class AudioChunk(Base):
    __tablename__ = "AudioChunk"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jobId = Column(String, ForeignKey("ConversionJob.id", ondelete="CASCADE"), nullable=False, index=True)
    chunkIndex = Column(Integer, nullable=False)
    textPreview = Column(Text, nullable=False)
    characterCount = Column(Integer, nullable=False)
    status = Column(SQLEnum(ChunkStatusEnum), default=ChunkStatusEnum.PENDING, nullable=False, index=True)
    retryCount = Column(Integer, default=0, nullable=False)
    filePath = Column(String, nullable=True)
    durationSeconds = Column(Float, nullable=True)
    errorMessage = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    job = relationship("ConversionJob", back_populates="chunks")

    __table_args__ = (
        UniqueConstraint("jobId", "chunkIndex", name="uq_job_chunk_index"),
    )


class AudioFile(Base):
    __tablename__ = "AudioFile"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    jobId = Column(String, ForeignKey("ConversionJob.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    storagePath = Column(String, nullable=False)
    fileSizeBytes = Column(BigInteger, nullable=False)
    durationSeconds = Column(Float, nullable=False)
    format = Column(SQLEnum(AudioFormatEnum), default=AudioFormatEnum.MP3, nullable=False)
    bitrateKbps = Column(Integer, default=128, nullable=False)
    checksumSha256 = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="audioFiles")
    job = relationship("ConversionJob", back_populates="audioFile")


class AuditLog(Base):
    __tablename__ = "AuditLog"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String, nullable=False, index=True)
    resource = Column(String, nullable=False)
    resourceId = Column(String, nullable=True)
    meta_data = Column("metadata", Text, nullable=True)
    ipAddress = Column(String, nullable=True)
    userAgent = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
