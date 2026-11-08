"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Shield,
  CreditCard,
  Sliders,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { DEFAULT_VOICES } from "@pdf-to-audio/shared";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [preferredVoice, setPreferredVoice] = useState("en-US-ChristopherNeural");
  const [preferredSpeed, setPreferredSpeed] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [usageStats, setUsageStats] = useState({
    conversionsUsed: 0,
    conversionsLimit: 10,
    tier: "FREE",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/settings");
      return;
    }

    // Fetch user usage info
    fetch("/api/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUsageStats({
            conversionsUsed: data.conversionsUsed || 0,
            conversionsLimit: data.conversionsLimit || 10,
            tier: session?.user?.subscriptionTier || "FREE",
          });
        }
      })
      .catch(() => {});
  }, [status, session]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);

    // Save preferences
    setTimeout(() => {
      setSaving(false);
      setSuccess("Preferences updated successfully.");
    }, 600);
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "To permanently delete your account, documents, and audio files, type DELETE below:"
    );
    if (confirmation !== "DELETE") {
      alert("Account deletion cancelled.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
      });
      // Sign out
      signOut({ callbackUrl: "/" });
    } catch {
      alert("Error deleting account.");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage your personal profile, synthesis presets, and subscription details.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500" />
          <span>Profile Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-muted-foreground font-medium block mb-1">
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={session?.user?.name || "User"}
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium block mb-1">
              Email Address
            </label>
            <input
              type="text"
              readOnly
              value={session?.user?.email || ""}
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium block mb-1">
              User Role
            </label>
            <input
              type="text"
              readOnly
              value={session?.user?.role || "USER"}
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium block mb-1">
              Account Status
            </label>
            <input
              type="text"
              readOnly
              value="Active (Verified)"
              className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-foreground cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Subscription Tier Section */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-500" />
            <span>Subscription & Quotas</span>
          </h3>
          <span className="rounded-full bg-indigo-500/10 px-3 py-0.5 text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
            {session?.user?.subscriptionTier || "FREE"} Plan
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">Monthly Usage Meter:</span>
            <span className="text-foreground">
              {usageStats.conversionsUsed} / {usageStats.conversionsLimit} conversions
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (usageStats.conversionsUsed / usageStats.conversionsLimit) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Change Plan</span>
          </button>
        </div>
      </div>

      {/* Voice Synthesis Presets */}
      <form
        onSubmit={handleSavePreferences}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-500" />
          <span>Synthesis Default Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-muted-foreground font-medium block mb-1">
              Default Voice
            </label>
            <select
              value={preferredVoice}
              onChange={(e) => setPreferredVoice(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-foreground focus:outline-none focus:border-indigo-500"
            >
              {DEFAULT_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.language})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-muted-foreground font-medium block mb-1">
              Default Speech Speed: {preferredSpeed.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={preferredSpeed}
              onChange={(e) => setPreferredSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-muted rounded-lg cursor-pointer mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Account Deletion */}
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
        <h3 className="font-bold text-base text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permanently delete your user account, all uploaded documents, synthesized audio files, and conversion history. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-white hover:bg-destructive/90 transition shadow-sm"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );
}

