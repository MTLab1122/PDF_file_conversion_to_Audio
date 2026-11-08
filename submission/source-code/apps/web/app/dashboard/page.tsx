"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileAudio,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  HardDrive,
  BarChart3,
  ArrowRight,
  Plus,
  Play,
  RotateCcw,
} from "lucide-react";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils";

interface DashboardStats {
  totalConversions: number;
  completedConversions: number;
  processingConversions: number;
  failedConversions: number;
  totalDocuments: number;
  totalStorageBytes: number;
  monthlyUsageRemaining: number;
  monthlyUsageLimit: number;
}

interface RecentJob {
  id: string;
  status: string;
  voiceName: string;
  createdAt: string;
  document: {
    originalFilename: string;
    fileSize: number;
    pageCount: number;
  };
  audioFile?: {
    id: string;
    durationSeconds: number;
    fileSizeBytes: number;
  } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalConversions: 0,
    completedConversions: 0,
    processingConversions: 0,
    failedConversions: 0,
    totalDocuments: 0,
    totalStorageBytes: 0,
    monthlyUsageRemaining: 10,
    monthlyUsageLimit: 10,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated") {
      loadDashboardData();
    }
  }, [status]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch usage & stats
      const [usageRes, jobsRes, docsRes] = await Promise.all([
        fetch("/api/usage"),
        fetch("/api/conversions?limit=6"),
        fetch("/api/documents?limit=1"),
      ]);

      let usageData = { conversionsUsed: 0, conversionsLimit: 10 };
      if (usageRes.ok) {
        usageData = await usageRes.json();
      }

      let jobs: RecentJob[] = [];
      let totalConversions = 0;
      let completedConversions = 0;
      let processingConversions = 0;
      let failedConversions = 0;

      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        jobs = jData.jobs || [];
        totalConversions = jData.pagination?.total || jobs.length;

        jobs.forEach((j) => {
          if (j.status === "COMPLETED") completedConversions++;
          else if (j.status === "FAILED") failedConversions++;
          else processingConversions++;
        });
      }

      let totalDocs = 0;
      let storageBytes = 0;
      if (docsRes.ok) {
        const dData = await docsRes.json();
        totalDocs = dData.pagination?.total || 0;
      }

      setStats({
        totalConversions,
        completedConversions,
        processingConversions,
        failedConversions,
        totalDocuments: totalDocs,
        totalStorageBytes: storageBytes,
        monthlyUsageRemaining: Math.max(
          0,
          usageData.conversionsLimit - usageData.conversionsUsed
        ),
        monthlyUsageLimit: usageData.conversionsLimit,
      });

      setRecentJobs(jobs);
    } catch {
      // transient fetch failure handled gracefully
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (jobStatus: string) => {
    switch (jobStatus) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
            <Clock className="h-3 w-3" />
            {jobStatus}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Welcome, {session?.user?.name || "Reader"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Monitor your conversions, speech synthesis quotas, and audio documents.
          </p>
        </div>

        <Link
          href="/convert"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Convert New PDF</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Conversions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FileAudio className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">
              {stats.totalConversions}
            </span>
            <span className="text-xs text-muted-foreground">jobs initiated</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed Audio
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">
              {stats.completedConversions}
            </span>
            <span className="text-xs text-muted-foreground">audio files ready</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Quota Left
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">
              {stats.monthlyUsageRemaining}
            </span>
            <span className="text-xs text-muted-foreground">
              of {stats.monthlyUsageLimit} conversions
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Documents
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <UploadCloud className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">
              {stats.totalDocuments}
            </span>
            <span className="text-xs text-muted-foreground">PDFs recorded</span>
          </div>
        </div>
      </div>

      {/* Recent Conversions Table */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-bold text-base text-foreground">
              Recent Conversions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live status of your audio generation pipeline
            </p>
          </div>

          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>View Full History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading dashboard conversions...
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <FileAudio className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <h4 className="font-semibold text-sm text-foreground">
              No conversions yet
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Upload your first PDF document to generate studio-quality neural MP3 audio.
            </p>
            <div className="mt-4">
              <Link
                href="/convert"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Start First Conversion</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="px-6 py-3">Document</th>
                  <th className="px-6 py-3">Voice</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground truncate max-w-xs">
                        {job.document?.originalFilename || "Untitled Document"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatBytes(job.document?.fileSize || 0)} •{" "}
                        {job.document?.pageCount || 0} pages
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {job.voiceName}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {job.audioFile?.durationSeconds
                        ? formatDuration(job.audioFile.durationSeconds)
                        : "--:--"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/conversions/${job.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition"
                      >
                        {job.status === "COMPLETED" ? (
                          <>
                            <Play className="h-3 w-3" />
                            <span>Listen</span>
                          </>
                        ) : (
                          <span>Details</span>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

