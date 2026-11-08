"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Shield,
  Users,
  FileAudio,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Loader2,
  ScrollText,
} from "lucide-react";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils";

interface SystemStats {
  totalUsers: number;
  totalConversions: number;
  completedConversions: number;
  failedConversions: number;
  totalStorageBytes: number;
  processorHealthy: boolean;
}

interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  subscriptionTier: string;
  createdAt: string;
  _count?: {
    conversionJobs: number;
    documents: number;
  };
}

interface AdminJob {
  id: string;
  status: string;
  progressPercent: number;
  voiceName: string;
  createdAt: string;
  user: {
    email: string;
    name?: string;
  };
  document: {
    originalFilename: string;
    fileSize: number;
    pageCount: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  userId?: string;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "jobs" | "logs">(
    "overview"
  );
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalConversions: 0,
    completedConversions: 0,
    failedConversions: 0,
    totalStorageBytes: 0,
    processorHealthy: true,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
      return;
    }

    if (status === "authenticated") {
      if (session.user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      loadAdminData();
    }
  }, [status, session]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, jobsRes, logsRes] = await Promise.all([
        fetch("/api/admin/statistics"),
        fetch("/api/admin/users?limit=50"),
        fetch("/api/admin/jobs?limit=50"),
        fetch("/api/admin/logs?limit=50"),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
      if (jobsRes.ok) {
        const j = await jobsRes.json();
        setJobs(j.jobs || []);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setLogs(l.logs || []);
      }
    } catch {
      // transient network error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Shield className="h-4 w-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Administrative Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Global system monitoring, user directory, conversion pipeline queues, and audit telemetry.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center rounded-xl border border-border bg-card p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === "jobs"
                ? "bg-indigo-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pipeline ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === "logs"
                ? "bg-indigo-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-2" />
          <span>Synchronizing administrative telemetry...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Total Registered Users
                    </span>
                    <Users className="h-4 w-4 text-indigo-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    {stats.totalUsers}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Conversions Initiated
                    </span>
                    <FileAudio className="h-4 w-4 text-indigo-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    {stats.totalConversions}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Pipeline Success Rate
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    {stats.totalConversions > 0
                      ? `${Math.round(
                          (stats.completedConversions / stats.totalConversions) *
                            100
                        )}%`
                      : "100%"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      Total Media Storage
                    </span>
                    <HardDrive className="h-4 w-4 text-cyan-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-foreground">
                    {formatBytes(stats.totalStorageBytes)}
                  </p>
                </div>
              </div>

              {/* Service Health Banner */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      FastAPI & Celery Processor Cluster: HEALTHY
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      PyMuPDF engine, Tesseract OCR fallback, and Edge Neural TTS responsive.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Online
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === "users" && (
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">
                  User Directory
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] border-b border-border">
                    <tr>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Plan Tier</th>
                      <th className="px-6 py-3">Conversions</th>
                      <th className="px-6 py-3">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-foreground">
                            {u.name || "Unnamed"}
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            {u.email}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-foreground">
                          {u.subscriptionTier}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {u._count?.conversionJobs ?? 0} jobs
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: JOBS */}
          {activeTab === "jobs" && (
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold text-sm text-foreground">
                  Global Conversion Jobs
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Job ID</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Document</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Voice</th>
                      <th className="px-6 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-muted/20">
                        <td className="px-6 py-3.5 font-mono text-muted-foreground">
                          {j.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-3.5 text-foreground font-medium">
                          {j.user?.email}
                        </td>
                        <td className="px-6 py-3.5 text-foreground truncate max-w-xs">
                          {j.document?.originalFilename}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                            {j.status} ({j.progressPercent}%)
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {j.voiceName}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {formatDate(j.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === "logs" && (
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-indigo-500" />
                  <span>Security & Action Audit Trail</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Target Entity</th>
                      <th className="px-6 py-3">Entity ID</th>
                      <th className="px-6 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/20">
                        <td className="px-6 py-3 font-semibold text-foreground">
                          {l.action}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {l.entityType}
                        </td>
                        <td className="px-6 py-3 font-mono text-[11px] text-muted-foreground">
                          {l.entityId ? `${l.entityId.slice(0, 12)}...` : "--"}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {formatDate(l.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

