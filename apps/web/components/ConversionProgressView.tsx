"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  FileSearch,
  ScanText,
  FileCheck,
  Scissors,
  Mic,
  Merge,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Ban,
  Loader2,
} from "lucide-react";

export interface ProgressData {
  id: string;
  status: string;
  progressPercent: number;
  stageMessage?: string;
  errorMessage?: string;
  totalChunks?: number;
  processedChunks?: number;
  audioFile?: {
    id: string;
    durationSeconds: number;
    fileSizeBytes: number;
  } | null;
}

interface ConversionProgressViewProps {
  conversionId: string;
  initialData?: ProgressData;
  onCompleted?: (audioFile: { id: string; durationSeconds: number }) => void;
}

const STAGES = [
  { key: "QUEUED", label: "Queued", icon: Clock },
  { key: "VALIDATING", label: "Validating PDF", icon: FileSearch },
  { key: "EXTRACTING", label: "Extracting Text", icon: ScanText },
  { key: "OCR", label: "OCR Processing", icon: ScanText },
  { key: "PREPROCESSING", label: "Cleaning Text", icon: FileCheck },
  { key: "CHUNKING", label: "Chunking", icon: Scissors },
  { key: "GENERATING_AUDIO", label: "Neural TTS", icon: Mic },
  { key: "MERGING", label: "FFmpeg Assembly", icon: Merge },
  { key: "COMPLETED", label: "Ready", icon: CheckCircle2 },
];

export function ConversionProgressView({
  conversionId,
  initialData,
  onCompleted,
}: ConversionProgressViewProps) {
  const [data, setData] = useState<ProgressData | null>(initialData || null);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`/api/conversions/${conversionId}/progress`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json);

      if (json.status === "COMPLETED" && json.audioFile && onCompleted) {
        onCompleted(json.audioFile);
      }
    } catch {
      // transient network glitch
    }
  };

  useEffect(() => {
    fetchProgress();

    // Poll if in-progress
    const interval = setInterval(() => {
      if (
        data &&
        (data.status === "COMPLETED" ||
          data.status === "FAILED" ||
          data.status === "CANCELLED")
      ) {
        clearInterval(interval);
        return;
      }
      fetchProgress();
    }, 2000);

    return () => clearInterval(interval);
  }, [conversionId, data?.status]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this conversion?")) return;
    setCancelling(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/conversions/${conversionId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProgress();
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to cancel job.");
      }
    } catch {
      setActionError("Network error while cancelling.");
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/conversions/${conversionId}/retry`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProgress();
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to retry job.");
      }
    } catch {
      setActionError("Network error while retrying.");
    } finally {
      setRetrying(false);
    }
  };

  const currentStatus = data?.status || "QUEUED";
  const percent = data?.progressPercent ?? 0;
  const isTerminal =
    currentStatus === "COMPLETED" ||
    currentStatus === "FAILED" ||
    currentStatus === "CANCELLED";

  // Determine stage progression index
  const stageOrder = [
    "QUEUED",
    "VALIDATING",
    "EXTRACTING",
    "OCR",
    "PREPROCESSING",
    "CHUNKING",
    "GENERATING_AUDIO",
    "MERGING",
    "COMPLETED",
  ];

  const currentStageIndex = stageOrder.indexOf(currentStatus);

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm text-card-foreground">
      {/* Top status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-lg text-foreground">
              Conversion Pipeline
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                currentStatus === "COMPLETED"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : currentStatus === "FAILED"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : currentStatus === "CANCELLED"
                  ? "bg-zinc-500/10 text-zinc-500"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 animate-pulse"
              }`}
            >
              {currentStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data?.stageMessage || "Initializing pipeline job..."}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!isTerminal && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              Cancel
            </button>
          )}

          {currentStatus === "FAILED" && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
            >
              {retrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Retry Conversion
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & percentage */}
      <div className="mt-6 space-y-2">
        <div className="flex justify-between items-center text-xs font-medium">
          <span className="text-muted-foreground">Progress Completion</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
            {percent}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              currentStatus === "COMPLETED"
                ? "bg-emerald-500"
                : currentStatus === "FAILED"
                ? "bg-rose-500"
                : "bg-gradient-to-r from-indigo-600 to-violet-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {data?.totalChunks && data.totalChunks > 0 ? (
          <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
            <span>Audio Chunk Generation</span>
            <span>
              {data.processedChunks || 0} / {data.totalChunks} chunks processed
            </span>
          </div>
        ) : null}
      </div>

      {/* Visual Pipeline Stages */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {STAGES.map((stg, idx) => {
          const Icon = stg.icon;
          const isDone =
            currentStatus === "COMPLETED" ||
            (currentStageIndex !== -1 && idx < currentStageIndex);
          const isCurrent = currentStageIndex === idx;

          return (
            <div
              key={stg.key}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                isDone
                  ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                  : isCurrent
                  ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                  : "border-border/60 bg-muted/20 text-muted-foreground opacity-60"
              }`}
            >
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-background shadow-xs">
                {isCurrent && !isTerminal ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                ) : isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-[10px] font-semibold leading-tight">
                {stg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error display if any */}
      {data?.errorMessage && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Pipeline Execution Failed</span>
            <p>{data.errorMessage}</p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  );
}

