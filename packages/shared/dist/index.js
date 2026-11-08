"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VOICES = exports.SUPPORTED_LANGUAGES = exports.PLAN_CONFIGS = exports.AudioFormat = exports.TTSProviderType = exports.JobStatus = exports.SubscriptionTier = exports.UserRole = void 0;
// User Roles & Authentication
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
// Subscription Tiers
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["FREE"] = "FREE";
    SubscriptionTier["PRO"] = "PRO";
    SubscriptionTier["BUSINESS"] = "BUSINESS";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
// Conversion Pipeline Stages / Statuses
var JobStatus;
(function (JobStatus) {
    JobStatus["QUEUED"] = "QUEUED";
    JobStatus["VALIDATING"] = "VALIDATING";
    JobStatus["EXTRACTING"] = "EXTRACTING";
    JobStatus["OCR"] = "OCR";
    JobStatus["PREPROCESSING"] = "PREPROCESSING";
    JobStatus["CHUNKING"] = "CHUNKING";
    JobStatus["GENERATING_AUDIO"] = "GENERATING_AUDIO";
    JobStatus["MERGING"] = "MERGING";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["FAILED"] = "FAILED";
    JobStatus["CANCELLED"] = "CANCELLED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
// TTS Providers
var TTSProviderType;
(function (TTSProviderType) {
    TTSProviderType["EDGE"] = "EDGE";
    TTSProviderType["AZURE"] = "AZURE";
    TTSProviderType["OPENAI"] = "OPENAI";
    TTSProviderType["MOCK"] = "MOCK";
})(TTSProviderType || (exports.TTSProviderType = TTSProviderType = {}));
// Audio Formats
var AudioFormat;
(function (AudioFormat) {
    AudioFormat["MP3"] = "mp3";
    AudioFormat["WAV"] = "wav";
    AudioFormat["OGG"] = "ogg";
})(AudioFormat || (exports.AudioFormat = AudioFormat = {}));
exports.PLAN_CONFIGS = {
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
exports.SUPPORTED_LANGUAGES = [
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
];
exports.DEFAULT_VOICES = [
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
//# sourceMappingURL=index.js.map