export declare enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN"
}
export declare enum SubscriptionTier {
    FREE = "FREE",
    PRO = "PRO",
    BUSINESS = "BUSINESS"
}
export declare enum JobStatus {
    QUEUED = "QUEUED",
    VALIDATING = "VALIDATING",
    EXTRACTING = "EXTRACTING",
    OCR = "OCR",
    PREPROCESSING = "PREPROCESSING",
    CHUNKING = "CHUNKING",
    GENERATING_AUDIO = "GENERATING_AUDIO",
    MERGING = "MERGING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum TTSProviderType {
    EDGE = "EDGE",
    AZURE = "AZURE",
    OPENAI = "OPENAI",
    MOCK = "MOCK"
}
export declare enum AudioFormat {
    MP3 = "mp3",
    WAV = "wav",
    OGG = "ogg"
}
export interface PlanLimits {
    tier: SubscriptionTier;
    name: string;
    maxConversionsPerMonth: number;
    maxPagesPerDoc: number;
    maxFileSizeMb: number;
    maxConcurrentJobs: number;
    premiumVoices: boolean;
    priorityQueue: boolean;
    priceMonthlyUsd: number;
}
export declare const PLAN_CONFIGS: Record<SubscriptionTier, PlanLimits>;
export interface VoiceOption {
    id: string;
    name: string;
    language: string;
    languageName: string;
    gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
    provider: TTSProviderType;
    isPremium: boolean;
    sampleUrl?: string;
}
export declare const SUPPORTED_LANGUAGES: readonly [{
    readonly code: "en-US";
    readonly name: "English (US)";
}, {
    readonly code: "en-GB";
    readonly name: "English (UK)";
}, {
    readonly code: "es-ES";
    readonly name: "Spanish (Spain)";
}, {
    readonly code: "fr-FR";
    readonly name: "French (France)";
}, {
    readonly code: "de-DE";
    readonly name: "German (Germany)";
}, {
    readonly code: "it-IT";
    readonly name: "Italian (Italy)";
}, {
    readonly code: "pt-BR";
    readonly name: "Portuguese (Brazil)";
}, {
    readonly code: "ja-JP";
    readonly name: "Japanese (Japan)";
}, {
    readonly code: "zh-CN";
    readonly name: "Chinese (Simplified)";
}, {
    readonly code: "ar-SA";
    readonly name: "Arabic (Saudi Arabia)";
}, {
    readonly code: "hi-IN";
    readonly name: "Hindi (India)";
}, {
    readonly code: "ur-PK";
    readonly name: "Urdu (Pakistan)";
}];
export declare const DEFAULT_VOICES: VoiceOption[];
export interface UserDTO {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    subscriptionTier: SubscriptionTier;
    createdAt: string;
}
export interface DocumentDTO {
    id: string;
    userId: string;
    filename: string;
    originalName: string;
    fileSizeBytes: number;
    mimeType: string;
    pageCount?: number | null;
    sha256Hash: string;
    createdAt: string;
}
export interface AudioChunkDTO {
    id: string;
    jobId: string;
    chunkIndex: number;
    characterCount: number;
    status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
    retryCount: number;
    error?: string | null;
    durationSeconds?: number | null;
}
export interface ConversionJobDTO {
    id: string;
    userId: string;
    documentId: string;
    status: JobStatus;
    progressPercent: number;
    currentStage: string;
    voiceId: string;
    language: string;
    speechSpeed: number;
    totalChunks: number;
    completedChunks: number;
    errorMessage?: string | null;
    audioFileId?: string | null;
    createdAt: string;
    updatedAt: string;
    document?: DocumentDTO;
    audioFile?: AudioFileDTO | null;
}
export interface AudioFileDTO {
    id: string;
    jobId: string;
    userId: string;
    filename: string;
    fileSizeBytes: number;
    durationSeconds: number;
    format: AudioFormat;
    bitrateKbps: number;
    downloadUrl?: string;
    createdAt: string;
}
export interface UsageSummaryDTO {
    userId: string;
    tier: SubscriptionTier;
    conversionsThisMonth: number;
    maxConversionsPerMonth: number;
    pagesThisMonth: number;
    maxPagesPerDoc: number;
    storageUsedBytes: number;
    activeJobsCount: number;
    maxConcurrentJobs: number;
    resetDate: string;
}
export interface ConversionProgressDTO {
    jobId: string;
    status: JobStatus;
    progressPercent: number;
    stage: string;
    currentChunk: number;
    totalChunks: number;
    error?: string | null;
    isComplete: boolean;
    audioFileId?: string | null;
}
export interface AdminStatsDTO {
    totalUsers: number;
    totalConversions: number;
    activeConversions: number;
    completedConversions: number;
    failedConversions: number;
    totalAudioSeconds: number;
    storageUsageMb: number;
    recentJobs: ConversionJobDTO[];
}
//# sourceMappingURL=index.d.ts.map