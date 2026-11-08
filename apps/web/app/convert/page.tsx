"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  UploadCloud,
  Mic,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { UploadZone, UploadedDocument } from "@/components/UploadZone";
import { VoiceSelector } from "@/components/VoiceSelector";
import { formatBytes } from "@/lib/utils";

export default function ConvertWizardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);

  // Conversion options
  const [voiceId, setVoiceId] = useState("en-US-ChristopherNeural");
  const [language, setLanguage] = useState("en-US");
  const [speed, setSpeed] = useState(1.0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleUploadSuccess = (doc: UploadedDocument) => {
    setUploadedDoc(doc);
    setStep(2);
  };

  const handleStartConversion = async () => {
    if (!uploadedDoc) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/conversions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploadedDoc.id,
          voiceId,
          voiceName: voiceId,
          language,
          speed,
          speechSpeed: speed,
          audioFormat: "MP3",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to start conversion.");
        setSubmitting(false);
        return;
      }

      // Redirect directly to the live conversion pipeline monitor
      router.push(`/conversions/${data.job.id}`);
    } catch {
      setSubmitError("Network error while starting conversion.");
      setSubmitting(false);
    }
  };

  const userTier = session?.user?.subscriptionTier || "FREE";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-foreground">
          Convert PDF to Neural Audio
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Transform your digital or scanned document into a high-fidelity MP3 audiobook.
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        <div
          className={`flex items-center gap-2 text-xs font-semibold ${
            step >= 1 ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
          }`}
        >
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step >= 1
                ? "bg-indigo-600 text-white"
                : "border border-border text-muted-foreground"
            }`}
          >
            1
          </div>
          <span>Upload PDF</span>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-border" />

        <div
          className={`flex items-center gap-2 text-xs font-semibold ${
            step >= 2 ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
          }`}
        >
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step >= 2
                ? "bg-indigo-600 text-white"
                : "border border-border text-muted-foreground"
            }`}
          >
            2
          </div>
          <span>Configure Voice</span>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-border" />

        <div
          className={`flex items-center gap-2 text-xs font-semibold ${
            step >= 3 ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
          }`}
        >
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step >= 3
                ? "bg-indigo-600 text-white"
                : "border border-border text-muted-foreground"
            }`}
          >
            3
          </div>
          <span>Review & Start</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Select Your PDF File
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Supports scanned and digital documents with structural reading order preservation.
              </p>
            </div>

            <UploadZone onUploadSuccess={handleUploadSuccess} />

            {uploadedDoc && (
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                >
                  <span>Next: Configure Voice</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Voice & Speech Settings
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pick a neural speaker and adjust speech cadence
                </p>
              </div>

              {uploadedDoc && (
                <div className="text-right text-xs">
                  <p className="font-semibold text-foreground truncate max-w-xs">
                    {uploadedDoc.originalFilename}
                  </p>
                  <p className="text-muted-foreground">
                    {uploadedDoc.pageCount} pages ({formatBytes(uploadedDoc.fileSize)})
                  </p>
                </div>
              )}
            </div>

            <VoiceSelector
              selectedVoiceId={voiceId}
              onVoiceChange={setVoiceId}
              speed={speed}
              onSpeedChange={setSpeed}
              userTier={userTier}
            />

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
              >
                <span>Next: Review & Start</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Review Conversion Parameters
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confirm your document configuration before initializing the pipeline
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Document File:</span>
                <span className="font-semibold text-foreground">
                  {uploadedDoc?.originalFilename}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Page Count:</span>
                <span className="font-semibold text-foreground">
                  {uploadedDoc?.pageCount} pages
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">File Size:</span>
                <span className="font-semibold text-foreground">
                  {formatBytes(uploadedDoc?.fileSize || 0)}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Voice:</span>
                <span className="font-semibold text-foreground">{voiceId}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Speech Speed:</span>
                <span className="font-semibold text-foreground">{speed}x</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Output Format:</span>
                <span className="font-semibold text-foreground">MP3 (24 kHz Studio)</span>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStartConversion}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Queuing Conversion...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Start Conversion Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

