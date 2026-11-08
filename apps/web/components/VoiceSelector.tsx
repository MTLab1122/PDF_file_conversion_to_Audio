"use client";

import React, { useState, useMemo } from "react";
import {
  DEFAULT_VOICES,
  SUPPORTED_LANGUAGES,
  VoiceOption,
} from "@pdf-to-audio/shared";
import { Mic, Volume2, Sparkles, Gauge, Check } from "lucide-react";

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  userTier?: string;
  disabled?: boolean;
}

export function VoiceSelector({
  selectedVoiceId,
  onVoiceChange,
  speed,
  onSpeedChange,
  userTier = "FREE",
  disabled = false,
}: VoiceSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-US");

  // Filter voices by selected language
  const filteredVoices = useMemo(() => {
    const list = DEFAULT_VOICES.filter((v) => v.language === selectedLanguage);
    return list.length > 0 ? list : DEFAULT_VOICES.filter((v) => v.language === "en-US");
  }, [selectedLanguage]);

  const speedPresets = [0.75, 1.0, 1.25, 1.5, 1.75];

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <span>Target Language</span>
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => {
            const newLang = e.target.value;
            setSelectedLanguage(newLang);
            const firstVoiceForLang = DEFAULT_VOICES.find((v) => v.language === newLang);
            if (firstVoiceForLang) {
              onVoiceChange(firstVoiceForLang.id);
            }
          }}
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Grid */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
          <span>Neural Voice Character</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {filteredVoices.length} voices available
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoiceId === voice.id;
            const isLocked = voice.isPremium && userTier === "FREE";

            return (
              <button
                key={voice.id}
                type="button"
                disabled={disabled || isLocked}
                onClick={() => onVoiceChange(voice.id)}
                className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-600"
                    : "border-border hover:border-border/80 hover:bg-muted/30"
                } ${isLocked ? "opacity-50 cursor-not-allowed bg-muted/20" : ""}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {voice.name}
                    </span>
                    {voice.isPremium && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Sparkles className="h-2.5 w-2.5" />
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{voice.gender.toLowerCase()}</span>
                    <span>•</span>
                    <span>Neural High-Def</span>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  {isSelected ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-border" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed Slider & Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-indigo-500" />
            <span>Speech Speed</span>
          </label>
          <span className="rounded bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {speed.toFixed(2)}x
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={speed}
          disabled={disabled}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-600 h-2 bg-muted rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between gap-1 pt-1">
          {speedPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onSpeedChange(preset)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                Math.abs(speed - preset) < 0.01
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

