"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  FileAudio,
  Layers,
  Sparkles,
  Calendar,
  Gauge,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  ConversionProgressView,
  ProgressData,
} from "@/components/ConversionProgressView";
import { AudioPlayer } from "@/components/AudioPlayer";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils";

interface ChunkDetail {
  id: string;
  chunkIndex: number;
  characterCount: number;
  status: string;
  retryCount: number;
}

interface JobFullDetails {
  id: string;
  status: string;
  voiceName: string;
  speed: number;
  language: string;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    originalFilename: string;
    fileSize: number;
    pageCount: number;
  };
  audioFile?: {
    id: string;
    durationSeconds: number;
    fileSizeBytes: number;
    storagePath: string;
  } | null;
  audioChunks?: ChunkDetail[];
}

export default function ConversionDetailPage() {
  const params = useParams();
  const conversionId = params.id as string;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [job, setJob] = useState<JobFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJob = async () => {
    try {
      const res = await fetch(`/api/conversions/${conversionId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Conversion job not found.");
        } else if (res.status === 401) {
          router.push(`/login?callbackUrl=/conversions/${conversionId}`);
        } else {
          setError("Failed to load conversion details.");
        }
        return;
      }

      const data = await res.json();
      setJob(data.job);
    } catch {
      setError("Network error while loading conversion details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/conversions/${conversionId}`);
      return;
    }
    loadJob();
  }, [conversionId, status]);

  const handleCompleted = () => {
    // Reload job to fetch fresh audioFile metadata & chunks
    loadJob();
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center text-xs text-muted-foreground">
        Loading conversion details...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">
          {error || "Conversion Not Found"}
        </h3>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top back & title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Conversions</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground truncate max-w-xl">
            {job.document?.originalFilename || "Conversion Pipeline"}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>Job ID: {job.id.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Conversion Pipeline Progress Tracker */}
      <ConversionProgressView
        conversionId={job.id}
        onCompleted={handleCompleted}
      />

      {/* Audio Player (when completed) */}
      {job.status === "COMPLETED" && job.audioFile && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Synthesized Audio Player
          </h3>
          <AudioPlayer
            audioId={job.audioFile.id}
            title={job.document?.originalFilename}
            initialDuration={job.audioFile.durationSeconds}
            downloadFilename={`${job.document?.originalFilename.replace(
              /\.pdf$/i,
              ""
            )}.mp3`}
          />
        </div>
      )}

      {/* Job Details Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Info */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-indigo-500" />
            <span>Document Metadata</span>
          </h4>
          <div className="divide-y divide-border text-xs">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Filename:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">
                {job.document?.originalFilename}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Page Count:</span>
              <span className="font-semibold text-foreground">
                {job.document?.pageCount} pages
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">File Size:</span>
              <span className="font-semibold text-foreground">
                {formatBytes(job.document?.fileSize || 0)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Uploaded:</span>
              <span className="font-semibold text-foreground">
                {formatDate(job.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Synthesis Info */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>Speech Synthesis Settings</span>
          </h4>
          <div className="divide-y divide-border text-xs">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Voice Engine:</span>
              <span className="font-semibold text-foreground">{job.voiceName}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Language:</span>
              <span className="font-semibold text-foreground">{job.language}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Speed Rate:</span>
              <span className="font-semibold text-foreground">{job.speed}x</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Audio Duration:</span>
              <span className="font-semibold text-foreground font-mono">
                {job.audioFile?.durationSeconds
                  ? formatDuration(job.audioFile.durationSeconds)
                  : "--:--"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chunk Breakdown Table */}
      {job.audioChunks && job.audioChunks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span>Sentence & Paragraph Chunks ({job.audioChunks.length})</span>
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Sequential audio chunk assembly
            </span>
          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] sticky top-0 border-b border-border">
                <tr>
                  <th className="px-4 py-2">Index</th>
                  <th className="px-4 py-2">Characters</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Retries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {job.audioChunks.map((chunk) => (
                  <tr key={chunk.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2 font-mono font-semibold">
                      #{chunk.chunkIndex + 1}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {chunk.characterCount} chars
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          chunk.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : chunk.status === "FAILED"
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-indigo-500/10 text-indigo-600"
                        }`}
                      >
                        {chunk.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {chunk.retryCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

