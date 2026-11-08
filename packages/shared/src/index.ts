// User Roles & Authentication
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Subscription Tiers
export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

// Conversion Pipeline Stages / Statuses
export enum JobStatus {
  QUEUED = 'QUEUED',
  VALIDATING = 'VALIDATING',
  EXTRACTING = 'EXTRACTING',
  OCR = 'OCR',
  PREPROCESSING = 'PREPROCESSING',
  CHUNKING = 'CHUNKING',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  MERGING = 'MERGING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// TTS Providers
export enum TTSProviderType {
  EDGE = 'EDGE',
  AZURE = 'AZURE',
  OPENAI = 'OPENAI',
  MOCK = 'MOCK',
}

// Audio Formats
export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
}

// Plan Configurations & Limits
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

export const PLAN_CONFIGS: Record<SubscriptionTier, PlanLimits> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Free Starter',
    maxConversionsPerMonth: 10,
    maxPagesPerDoc: 20,
    maxFileSizeMb: 10,
    maxConcurrentJobs: 1,
    premiumVoices: false,
    priorityQueue: false,
    priceMonthlyUsd: 0,
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    name: 'Pro Audio',
    maxConversionsPerMonth: 100,
    maxPagesPerDoc: 150,
    maxFileSizeMb: 50,
    maxConcurrentJobs: 3,
    premiumVoices: true,
    priorityQueue: true,
    priceMonthlyUsd: 19,
  },
  [SubscriptionTier.BUSINESS]: {
    tier: SubscriptionTier.BUSINESS,
    name: 'Enterprise / Business',
    maxConversionsPerMonth: 1000,
    maxPagesPerDoc: 500,
    maxFileSizeMb: 100,
    maxConcurrentJobs: 10,
    premiumVoices: true,
    priorityQueue: true,
    priceMonthlyUsd: 79,
  },
};

// Voice and Language Definitions
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

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)' },
] as const;

export const DEFAULT_VOICES: VoiceOption[] = [
  {
    id: 'en-US-ChristopherNeural',
    name: 'Christopher (Warm, Natural)',
    language: 'en-US',
    languageName: 'English (US)',
    gender: 'MALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (Clear, Friendly)',
    language: 'en-US',
    languageName: 'English (US)',
    gender: 'FEMALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (Narrative, Calm)',
    language: 'en-US',
    languageName: 'English (US)',
    gender: 'MALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (Expressive, Crisp)',
    language: 'en-US',
    languageName: 'English (US)',
    gender: 'FEMALE',
    provider: TTSProviderType.EDGE,
    isPremium: true,
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (British, Refined)',
    language: 'en-GB',
    languageName: 'English (UK)',
    gender: 'FEMALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (British, Authoritative)',
    language: 'en-GB',
    languageName: 'English (UK)',
    gender: 'MALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
  {
    id: 'es-ES-AlvaroNeural',
    name: 'Alvaro (Spanish, Direct)',
    language: 'es-ES',
    languageName: 'Spanish (Spain)',
    gender: 'MALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
  {
    id: 'fr-FR-HenriNeural',
    name: 'Henri (French, Melodic)',
    language: 'fr-FR',
    languageName: 'French (France)',
    gender: 'MALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
  {
    id: 'de-DE-ConradNeural',
    name: 'Conrad (German, Articulate)',
    language: 'de-DE',
    languageName: 'German (Germany)',
    gender: 'MALE',
    provider: TTSProviderType.EDGE,
    isPremium: false,
  },
];

// DTO and Entity Types
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
  speechSpeed: number; // e.g. 1.0 (0.5 to 2.0)
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

