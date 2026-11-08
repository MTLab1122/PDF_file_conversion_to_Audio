"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Filter,
  FileAudio,
  Play,
  Download,
  Trash2,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils";

interface JobItem {
  id: string;
  status: string;
  voiceName: string;
  speed: number;
  language: string;
  createdAt: string;
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
  } | null;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/conversions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotalCount(data.pagination?.total || (data.jobs || []).length);
      }
    } catch {
      // transient network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/history");
      return;
    }
    if (status === "authenticated") {
      fetchJobs();
    }
  }, [status, page, statusFilter]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this conversion and its audio?")) {
      return;
    }
    setDeletingId(jobId);
    try {
      const res = await fetch(`/api/conversions/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchJobs();
      } else {
        alert("Failed to delete conversion.");
      }
    } catch {
      alert("Network error while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      const res = await fetch(`/api/conversions/${jobId}/retry`, {
        method: "POST",
      });
      if (res.ok) {
        fetchJobs();
      } else {
        alert("Failed to retry conversion.");
      }
    } catch {
      alert("Network error while retrying.");
    } finally {
      setRetryingId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      job.document?.originalFilename?.toLowerCase().includes(term) ||
      job.voiceName?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
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
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
            <Clock className="h-3 w-3" />
            {s}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Conversion History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your past conversions, listen to audio files, or download MP3s.
          </p>
        </div>

        <Link
          href="/convert"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Conversion</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search documents or voices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="QUEUED">In Progress</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600 mb-2" />
            <span>Loading conversion records...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FileAudio className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h4 className="font-semibold text-sm text-foreground">
              No matching conversions found
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search criteria or start a new conversion.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="px-6 py-3.5">Document</th>
                  <th className="px-6 py-3.5">Voice Engine</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Audio Duration</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20 transition">
                    <td className="px-6 py-4">
                      <Link
                        href={`/conversions/${job.id}`}
                        className="font-semibold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 block truncate max-w-xs transition"
                      >
                        {job.document?.originalFilename || "Untitled Document"}
                      </Link>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {formatBytes(job.document?.fileSize || 0)} •{" "}
                        {job.document?.pageCount || 0} pages
                      </div>
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{job.voiceName}</div>
                      <div className="text-[10px] font-mono">{job.speed}x speed</div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/conversions/${job.id}`}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                          title="Open Details / Player"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Link>

                        {job.status === "COMPLETED" && job.audioFile && (
                          <a
                            href={`/api/audio/${job.audioFile.id}/download`}
                            download
                            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                            title="Download MP3"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}

                        {job.status === "FAILED" && (
                          <button
                            type="button"
                            onClick={() => handleRetry(job.id)}
                            disabled={retryingId === job.id}
                            className="rounded-lg border border-border p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                            title="Retry Conversion"
                          >
                            {retryingId === job.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(job.id)}
                          disabled={deletingId === job.id}
                          className="rounded-lg border border-border p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition"
                          title="Delete Record"
                        >
                          {deletingId === job.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
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

